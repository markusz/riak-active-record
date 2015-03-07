var Bucket = require('../datastores/bucket');
var _ = require('lodash');

var validateConfig = function(config) {
  if (!config.bucketName) {
    throw new Error('No bucket name provided in the config');
  }
};

var validateSchema = function(schema) {
  if (Object.keys(schema).length < 1) {
    throw new Error('Your schema has no entries');
  }

  var keys = [];
  var numericIndexes = [];
  var binaryIndexes = [];
  _.forEach(schema, function(value, key) {
    if (value.key) {
      keys.push(key);
    }

    if (value.index) {
      if (value.type === Number) {
        numericIndexes.push(key);
      } else {
        binaryIndexes.push(key);
      }
      keys.push(key);
    }
    console.log(value, key);
  });

  return {
    keys: keys,
    numericIndexes: numericIndexes,
    binaryIndexes: binaryIndexes
  };
};

module.exports = function(schema, config) {

  validateConfig(config);
  validateSchema(schema);
  var bucket = new Bucket(config.bucketName);

  var prepareSchema = function(schema) {

  }

  var RiakModel = function(bucketName, schema, config) {

  };

  RiakModel.prototype._makeIndexes = function(res) {
    Object.defineProperty(this, '_indexes', { value: res._indexes, writable: true });
  };

  RiakModel.prototype.createInstance = function(cb) {

  };

  RiakModel.prototype.key = function() {
    //Per default, a model is valid. Individual models may overwrite this to add model-specific logic
    throw new Error('This is just an interface that has to be implemented in the concrete model');
  };

  RiakModel.delete = function(key, cb) {
    bucket.remove(key, function(err) {
      if (err) {
        return cb(err);
      }
      return cb(null);
    });
  };

  RiakModel.load = function(key, cb) {
    var that = this;
    bucket.find(key, function(err, res) {
      if (err) {
        return cb(err);
      }

      that._setVClock(res);
      that._transform(res);
      that._makeIndexes(res);
      cb(null, that);
    });
  };

  RiakModel.updateAttribute = function(attributeName, attributeValue, cb) {
    this[attributeName] = attributeValue;
    if (!this.valid()) {
      return cb(new Error('Invalid element'));
    }
    this.save(function(err, res) {
      if (err) {
        cb(err);
      }
      cb(null, res);
    });
  };

  RiakModel.prototype.save = function(cb) {
    if (!this.valid()) {
      return cb(new Error('Invalid element'));
    }
    bucket.save(this, cb);
  };

  RiakModel.prototype.valid = function() {
    return true;
  };

//can be used to make changes to the object after loading it
  RiakModel.prototype._transform = function(res) {
    //Per default, we don't transform the object
  };

  RiakModel.prototype._setVClock = function() {
    return this._vclock ? { vclock: this._vclock } : {};
  };

  return RiakModel;
};