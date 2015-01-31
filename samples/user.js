'use strict';

var request = require('request');
var oauthConfig = require('../../../config/oauth')[process.env.NODE_ENV];
var log4js = require('log4js');
var log = log4js.getLogger('auth');
var async = require('async');
var _bucket = require('model/database/data_store');
var modelFactory = require('model/model_factory');
var _ = require('lodash');

var USER_SERVICE_TOKEN_LENGTH = 64;

var adminIds = ['admin'];
var FAKE_IDS = {
  'max-token': 'max',
  'healthuser-token': 'healthuser',
  'admin-token': 'admin'
};

module.exports = function(namespace) {
  var ds = new _bucket('sessions', namespace);

  var User = function(id, token) {
    this.id = id;
    this.token = token;
    this.appId = namespace;
    this.cached = undefined;

    Object.defineProperty(this, 'errors', { value: [], writable: true });
  };

  User.removeAllRelatedEntriesFromRiakBasedOnRequest = function(userId, onSuccess, onError) {
    var user = new User(userId);
    user.removeAllRelatedEntriesFromRiak(function(err, result) {
      if (err) {
        return onError(err);
      }
      return onSuccess(result);
    });
  };

  User.prototype.removeAllRelatedEntriesFromRiak = function(callback) {
    var that = this;
    var createDeleteFunctionForModel = function(model, label) {
      return function(cb) {
        //removeUserRelatedData is defined in AbstractRecord and is supported by every model that inherits from it.
        model.removeUserRelatedData(function(err, res) {
          if (err && !err.notFound) {
            return cb({ user: that._user, stage: label, error: err });
          }
          cb(null, { label: label, status: 204 });
        });
      };
    };

    var deleteCalls = [];

    var History = modelFactory.get('history', namespace);
    var Favorite = modelFactory.get('favorite', namespace);
    var Watchlist = modelFactory.get('watchlist', namespace);
    var Preferences = modelFactory.get('preferences', namespace);
    var Subscriptions = modelFactory.get('subscriptions', namespace);
    var Receipt = modelFactory.get('receipt', namespace);

    deleteCalls.push(createDeleteFunctionForModel(new Receipt(this), 'receipts'));
    deleteCalls.push(createDeleteFunctionForModel(new Favorite(this), 'favorites'));
    deleteCalls.push(createDeleteFunctionForModel(new Watchlist(this), 'watchlists'));
    deleteCalls.push(createDeleteFunctionForModel(new Preferences(this), 'preferences'));
    deleteCalls.push(createDeleteFunctionForModel(new Subscriptions(this), 'subscriptions'));
    deleteCalls.push(createDeleteFunctionForModel(new History(this), 'history'));

    var makeJSONResponse = function(results) {
      var endresult = {};
      for (var i = 0; i < results.length; i++) {
        endresult[results[i].label] = results[i].status;
      }
      return endresult;
    };

    var asyncDeleteHandler = function(err, results) {
      if (err) {
        return callback(err);
      }
      callback(null, makeJSONResponse(results));
    };

    async.parallel(deleteCalls, asyncDeleteHandler);
  };

  User.prototype.removeUserRelatedData = function(cb) {
    this.removeUserFromRiakCache(cb);
  };

  User.prototype.removeUserFromRiakCache = function(cb) {
    ds.findKeysOfEntriesWithSecondaryIndex('user_bin', this.id, function(err, keys) {
      async.eachSeries(keys, function(key, cb) {
        ds.removeByKey(key, cb);
      }, function(err) {
        cb(err);
      });
    });
  };

  User.prototype.key = function() {
    return this.appId + '_' + this.token;
  };

  User.prototype.cache = function(cb) {
    if (!cb) {
      cb = function() {
      }; // default to noop for cache callback
    }
    ds.save(this, cb);
  };

  User.prototype.authorized = function() {
    return this.id != null;
  };

  User.prototype.isAdmin = function() {
    return (adminIds.indexOf(this.id) !== -1);
  };

  User.prototype.load = function(cb) {
    var that = this;

    if (!that._hasToken()) {
      return cb({ id: 'unauthenticated' });
    }

    if (Object.keys(FAKE_IDS).indexOf(that.token) !== -1) {
      // Using a fake Id ey?
      log.info('Fake id for ' + that.token + ' has been used');
      that.id = FAKE_IDS[that.token];
      return cb(null, that);
    }

    log.info('Checking local cache for token...');
    ds.findByKey(this.key(), null, function(err, data) {
      if (err || data === null) {
        log.info('Token not in cache.');
        that._loadFromRemote(cb);
      } else {
        log.info('Token in local cache. Authenticated.');
        that.id = data.id;
        that.cached = true;
        cb(null, that);
      }
    });
  };

  User.prototype._hasToken = function() {
    return this.token != null;
  };

  User.prototype._getLegacyOAuthOptionsForApp = function() {
    var endPoint = oauthConfig[this.appId].site + oauthConfig[this.appId].profile;
    return {
      url: endPoint + '?access_token=' + this.token
    };
  };

  User.prototype._get7PassOAuthOptionsForApp = function() {
    var endPoint = oauthConfig[this.appId].ssoSite + oauthConfig[this.appId].ssoProfile;
    return {
      url: endPoint,
      auth: {
        bearer: this.token
      }
    };
  };

  User.prototype._loadFromRemote = function(cb) {
    var that = this;

    if (_.isUndefined(oauthConfig[this.appId]) || _.isUndefined(oauthConfig[this.appId].site) || _.isUndefined(oauthConfig[this.appId].ssoSite)) {
      return cb({ id: 'unauthenticated' });
    }
    log.info('Loading Token from remote...');

    var options;

    // Tokens exactly 64 characters long are from the legacy service, all others are from the new 7Pass Service
    if (this.token.length === USER_SERVICE_TOKEN_LENGTH) {
      log.info('Loading Token from legacy oauth facade userservice remote...');
      options = this._getLegacyOAuthOptionsForApp();
    } else {
      log.info('Loading Token from 7Pass SSO service remote...');
      options = this._get7PassOAuthOptionsForApp();
    }

    request.get(options, function(err, res, user) {
      if (err) {
        return cb(err);
      }
      if (res.statusCode === 401) {
        log.info('Got response. Not Authenticated.');
        return cb({ id: 'unauthenticated' });
      }

      try {
        user = JSON.parse(user);
      } catch (_err) {
        return cb({ id: 'invalid', message: 'Internal authentication error' });
      }
      log.info('Got response. Authenticated.');

      if (user.migrated_ids && user.migrated_ids[oauthConfig[that.appId].ssoClientId]) {
        that.id = user.migrated_ids[oauthConfig[that.appId].ssoClientId];
      } else {
        that.id = user.uid;
      }

      that.cached = false;

      that.cache(); // cache the user, but we don't have to wait for it!
      that._verifyCurrentReceipt(cb);
    });
  };

  User.prototype._verifyCurrentReceipt = function(cb) {
    var that = this;
    var Receipt = modelFactory.get('receipt', namespace);
    var receipt = new Receipt(this);
    receipt.getLatestReceipt(function(err, latestReceipt) {
      if (err) {
        return cb(err);
      }
      if (!latestReceipt) {
        log.info('no latest receipt so we have nothing to verify');
        return cb(null, that);
      }
      log.info('verifying latest receipt ' + latestReceipt.key);
      latestReceipt.verifyWithUpdate(false, function() {
        return cb(null, that);
      });
    });
  };

  User.prototype.valid = function() {
    this.errors = [];
    if (this.id === null) {
      this.errors.push('Invalid ID.');
    }
    return (this.errors.length === 0);
  };

  User.prototype._setVClock = function() {
    var meta = {};
    meta.index = { user: this.id };
    if (this._vclock) {
      meta.vclock = this._vclock;
    }
    return meta;
  };

  User.getDataStore = function() {
    return ds;
  };

  return User;
};