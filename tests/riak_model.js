var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var RiakModel = require('../lib/records/riak_model');
var _ = require('lodash');

describe('RiakModel', function() {
  var validSchema = { a: { type: Number } };
  var validConfig = { bucketName: 'testbucket' };

  it('should throw an error for a schema without bucket name', function() {
    var invalidConfig = _.cloneDeep(validConfig);
    delete invalidConfig.bucketName;
    assert.throws(function() {
      RiakModel(validSchema, invalidConfig);
    });
  });

  it('should return a class', function() {
    var model = RiakModel(validSchema, validConfig);
    assert.isFunction(model);
  });

  it('should return a class with static function load', function() {
    var model = RiakModel(validSchema, validConfig);
    assert.isFunction(model.load);
  });
});