var config = {};
var riakJSClient = require('riak-js').getClient(config);
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

Bucket.prototype.save = function(key, model, cb) {
  var meta = model._makeMeta ? model._makeMeta() : {};
  riakJSClient.save(this.bucket, model.key(), model, meta, function(err, res, receivedMetadata) {
    if (err) {
      return cb(err);
    }
    // set the new vclock on write
    model._vclock = receivedMetadata.vclock;
    cb(null, model);
  });
};

Bucket.prototype._removeSuffixFromIndex = function(index) {
  var suffixes = ['_bin', '_int'];
  for (var i = 0; i < suffixes.length; i++) {
    var croppedSuffix = suffixes[i];

    var endsWithSuffix = index.indexOf(croppedSuffix, index.length - croppedSuffix.length) !== -1;
    if (endsWithSuffix) {
      return index.substring(0, index.length - croppedSuffix.length);
    }
  }
  return index;
};


Bucket.prototype.empty = function(cb) {
  var buffer = [];
  var bucket = this.bucket;
  var keyStream = riakJSClient.keys(bucket, {}, function(er, data, _meta) {
    async.all(
      buffer,
      function(key, cb) {
        riakJSClient.remove(bucket, key, function() {
          cb(true);
        });
      },
      function(res) {
        cb(null);
      }
    );
  });
  keyStream.on('keys', function(keys) {
    buffer = buffer.concat(keys);
  });
  keyStream.start();
};

module.exports = Bucket;