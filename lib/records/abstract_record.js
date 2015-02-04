var AbstractRecord = function() {
};

AbstractRecord.prototype.delete = function(cb) {
  this.bucket.remove(this, function(err) {
    if (err) {
      return cb(err);
    }
    return cb(null);
  });
};

AbstractRecord.prototype.load = function(cb) {
  var that = this;
  this.bucket.find(this.key(), function(err, res) {
    if (err) {
      return cb(err);
    }

    that._setVClock(res);
    that._setProperties(res);
    that._transform(res);
    that._makeIndexes(res);
    cb(null, that);
  });
};

AbstractRecord.prototype.updateAttribute = function(attributeName, attributeValue, cb) {
  this[attributeName] = attributeValue;
  this.save(function(err, res) {
    if (err) {
      cb(err);
    }
    cb(null, res);
  });
};

AbstractRecord.prototype._setProperties = function() {

};

AbstractRecord.prototype.save = function(cb) {
  if (!this.valid()) {
    return cb(new Error('Invalid element'));
  }
  this.bucket.save(this, cb);
};

AbstractRecord.prototype.valid = function() {
  return true;
};

AbstractRecord.prototype.key = function() {
  //Models have to overwrite this with their own logic
  throw new Error('This is just an interface that has to be implemented in the concrete model');
};

//can be used to make changes to the object after loading it
AbstractRecord.prototype._transform = function(res) {
  //Per default, we don't transform the object
};

AbstractRecord.prototype._setVClock = function() {
  return this._vclock ? { vclock: this._vclock } : {};
};

AbstractRecord.prototype._makeIndexes = function(res) {
  Object.defineProperty(this, '_indexes', { value: res._indexes, writable: true });
};

AbstractRecord.prototype._makeMeta = function(res) {
  Object.defineProperty(this, '_indexes', { value: res._indexes, writable: true });
};

module.exports = AbstractRecord;