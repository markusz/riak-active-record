var chai = require('chai');
var assert = chai.assert;
var AbstractRecord = require('../lib/records/abstract_record');

describe('AbstractRecord', function() {
  var abstractRecord;
  beforeEach(function() {
    abstractRecord = new AbstractRecord();
  });

  describe('Constructor', function() {
    it('should be exported when the module is required', function() {
      assert.isFunction(AbstractRecord);
    });

    it('should instantiate an object', function() {
      assert.isObject(abstractRecord);
    });
  });

  describe('.delete', function() {
    it('should be a function', function() {
      assert.isFunction(abstractRecord.delete);
    });
  });

  describe('.load', function() {
    it('should be a function', function() {
      assert.isFunction(abstractRecord.load);
    });
  });

  describe('.updateAttribute', function() {
    it('should be a function', function() {
      assert.isFunction(abstractRecord.updateAttribute);
    });
  });

  describe('._setProperties', function() {
    it('should be a function', function() {
      assert.isFunction(abstractRecord._setProperties);
    });
  });

  describe('.valid', function() {
    it('should be a function', function() {
      assert.isFunction(abstractRecord.valid);
    });
  });

  describe('.key', function() {
    it('should be a function', function() {
      assert.isFunction(abstractRecord.key);
    });

    it('should throw an Error', function() {
      assert.throws(function() {
        abstractRecord.key();
      });
    });
  });

  describe('._transform', function() {
    it('instance should have function ._transform', function() {
      assert.isFunction(abstractRecord._transform);
    });
  });

  describe('._setVClock', function() {
    it('instance should have function ._setVClock', function() {
      assert.isFunction(abstractRecord._setVClock);
    });
  });

  describe('._makeIndexes', function() {
    it('instance should have function ._makeIndexes', function() {
      assert.isFunction(abstractRecord._makeIndexes);
    });
  });

  describe('._makeMeta', function() {
    it('instance should have function ._makeMeta', function() {
      assert.isFunction(abstractRecord._makeMeta);
    });
  });

});