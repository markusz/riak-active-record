module.exports = {
	AbstractRecord: require('./lib/records/riak_record'),
	Bucket: require('./lib/datastores/bucket'),
	getBucketHandler: function(bucketName){
		var Bucket = require('./lib/datastores/bucket')
		return new Bucket(bucketName);
	}
};