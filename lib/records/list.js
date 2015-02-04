var util = require('util');
var AbstractRecord = require('./abstract_record');
var precondition = require('precond');

var List /* extends AbstractRecord */ = function() {
};

util.inherits(List, AbstractRecord);

List.prototype.isOmittable = function() {
  return false;
};

List.prototype.delete = function(cb) {
  this.bucket.remove(this, function(err) {
    if (err) {
      return cb(err);
    }
    return cb(null);
  });
};

List.prototype.saveOrDeleteIfOmittable = function(cb) {
  if (this.isOmittable()) {
    return this.destroy(cb);
  }
  this.save(cb);
};

List.prototype._getDefaultValue = function() {
  return { entries: [] };
};

List.prototype.empty = function(cb) {
  if (!this.valid()) {
    return cb(new Error('Invalid object'));
  }

  this.load(function(err, model) {
    if (err) {
      return cb(err);
    }

    model.entries = [];
    model.saveOrDeleteIfOmittable(cb);
  });
};

/* interface */
List.prototype.getGloballyIdentifyingKeys = function() {
  precondition.checkState(false, 'Default implementation of getGloballyIdentifyingKeys in GenericEntryList can not be used. Make sure to provide a concrete implementation');
  return []; // return your own array in an overriding object
};

List.prototype._equal = function(entryA, entryB) {
  var keys = this.getGloballyIdentifyingKeys();
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (entryA[key] !== entryB[key]) {
      return false;
    }
  }
  return true;
};

List.prototype.indexOfEntry = function(entry) {
  for (var i = 0; i < this.entries.length; i++) {
    if (this._equal(entry, this.entries[i])) {
      return i;
    }
  }
  return -1;
};

List.prototype.removeEntry = function(entry, cb) {
  if (!entry) {
    return cb(new Error('entry is missing'));
  }

  this.load(function(err, model) {
    if (err) {
      return cb(err);
    }

    var indexOfElement = model.indexOfEntry(entry);
    if (indexOfElement === -1) {
      return cb(new Error('entry does not exist'));
    }
    model.entries.splice(indexOfElement, 1);
    model.saveOrDeleteIfOmittable(cb);
  });
};

module.exports = List;