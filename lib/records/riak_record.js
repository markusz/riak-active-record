var RiakRecord = function() {
};

RiakRecord.prototype.delete = function(cb) {
  this.bucket.remove(this, function(err) {
    if (err) {
      return cb(err);
    }
    return cb(null);
  });
};

RiakRecord.prototype.load = function(cb) {
  var that = this;
  this.bucket.find(this.key(), function(err, res) {
    if (err) {
      return cb(err);
    }

    that._setVClock(res);
    that._transform(res);
    that._makeIndexes(res);
    cb(null, that);
  });
};

RiakRecord.prototype.updateAttribute = function(attributeName, attributeValue, cb) {
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

RiakRecord.prototype.save = function(cb) {
  if (!this.valid()) {
    return cb(new Error('Invalid element'));
  }
  this.bucket.save(this, cb);
};

RiakRecord.prototype.valid = function() {
  return true;
};

RiakRecord.prototype.key = function() {
  //Per default, a model is valid. Individual models may overwrite this to add model-specific logic
  throw new Error('This is just an interface that has to be implemented in the concrete model');
};

//can be used to make changes to the object after loading it
RiakRecord.prototype._transform = function(res) {
  //Per default, we don't transform the object
};

RiakRecord.prototype._setVClock = function() {
  return this._vclock ? { vclock: this._vclock } : {};
};

RiakRecord.prototype._makeIndexes = function(res) {
  Object.defineProperty(this, '_indexes', { value: res._indexes, writable: true });
};

module.exports = RiakRecord;