var config = {};
var riakJSClient = require('riak-js')(config);
var async = require('async');
var _ = require('lodash');

var Bucket = function(bucketName) {
  this.bucket = bucketName;
};

Bucket.prototype.getRiakJSClient = function() {
  return riakJSClient;
};

Bucket.prototype.find = function(key, cb) {
  riakJSClient.get(this.bucket, key, function(err, data, meta) {
    if (err) {
      return cb(err);
    }
    if (meta.statusCode === 300) {
      Object.defineProperty(data, '_siblings', { value: true });
    }

    Object.defineProperty(data, '_vclock', { value: meta.vclock });
    Object.defineProperty(data, '_indexes', { value: Bucket.extractIndexesFromMetadata(meta) });
    cb(null, data, meta);
  });
};

Bucket.prototype.remove = function(key, cb) {
  var that = this;
  riakJSClient.remove(that.bucket, key, function(err, res, meta) {
    if (err) {
      return cb(err);
    }
    return cb(err, res, meta);
  });
};

Bucket.prototype.save = function(model, cb) {
  this.saveModelWithKey(model.key(), model, cb);
};

Bucket.prototype.save = function(key, model, cb) {
  riakJSClient.save(this.bucket, key, model, generatedMetadata, function(err, res, receivedMetadata) {
    if (err) {
      return cb(err);
    }
    // set the new vclock on write
    model._vclock = receivedMetadata.vclock;
    cb(null, model);
  });
};

Bucket.prototype.ensureSecondaryIndexWithoutSuffix = function(key) {
  var suffixes = ['_bin', '_int'];
  for (var i = 0; i < suffixes.length; i++) {
    var croppedSuffix = suffixes[i];

    var endsWithSuffix = key.indexOf(croppedSuffix, key.length - croppedSuffix.length) !== -1;
    if (endsWithSuffix) {
      return key.substring(0, key.length - croppedSuffix.length);
    }
  }
  return key;
};

Bucket.prototype.ensureSecondaryIndexWithSuffix = function(key, value) {
  var suffix = (typeof value === 'number') ? '_int' : '_bin';
  var endsWithSuffix = key.indexOf(suffix, key.length - suffix.length) !== -1;
  if (!endsWithSuffix) {
    return key + '' + suffix;
  }
  return key;
};

Bucket.prototype.empty = function(cb) {
  var buffer = [];
  var bucket = this.bucket;
  var keyStream = db.keys(bucket, {}, function(er, data, _meta) {
    async.all(
      buffer,
      function(key, cb) {
        db.remove(bucket, key, function() {
          cb(true);
        });
      },
      function(res) {
        cb(null);
      }
    );
  });
  keyStream.on("keys", function(keys) {
    buffer = buffer.concat(keys);
  });
  keyStream.start();
};

module.exports = Bucket;