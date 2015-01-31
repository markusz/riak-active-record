var AbstractRecord = require('../index').AbstractRecord;
var bucketName = 'entries';
var bucketHandler = require('../index').getBucketHandler(bucketName);


var Entry /* extends AbstractRecord */ = function(user, entryId) {
	Object.defineProperty(this, '_bucket', {value: bucketHandler});
	Object.defineProperty(this, '_user', {value: user});

	if(user !== null) {
		this.userId = user.id;
	}

	this[config.newFavoritesUpdate.riakAttributePerFavoriteKey] = 0;
	this.createTimestamp = Date.now();
};

util.inherits(Entry, AbstractRecord);

Entry.load = function(key, cb) {
	var User = modelFactory.get('user', namespace);
	var Format = modelFactory.get('format', namespace);

	//We have to load first since we don't use a separator between the two parts of the key
	bucketHandler.findByKey(key, undefined, function(err, res) {
		if(err) {
			return cb(err);
		}
		var user = new User(res.userId, null);
		var format = new Format(res.formatId, null);
		var favorite = new Entry(user, format);
		favorite.load(cb);
	});
};

Entry.prototype._transform = function() {
	if(_.isUndefined(this[config.newFavoritesUpdate.riakAttributePerFavoriteKey])) {
		this[config.newFavoritesUpdate.riakAttributePerFavoriteKey] = 0;
	}
};

function sortByCreateTimestamp(a, b) {
	return b.createTimestamp - a.createTimestamp;
}

Entry.prototype.list = function(cb) {
	this.DS.findEntriesWithSecondaryIndex('user', this.userId, function(err, favorites) {
		if(err) {
			cb(err);
		} else {
			favorites.sort(sortByCreateTimestamp);
			cb(null, favorites);
		}
	});
};

Entry.prototype.setAttribute = function(attributeName, attributeValue, cb) {
	var self = this;

	self[attributeName] = attributeValue;
	self.DS.save(self, cb);
};

Entry.prototype.key = function() {
	return '' + this._user.id;
};

Entry.prototype._setProperties = function(loaded) {
	Object.defineProperty(this, '_vclock', {value: loaded._vclock, writable: true});
	var props = _.omit(loaded, '_vclock');
	_.extend(this, props);
};

Entry.prototype.valid = function() {
	var isUserOk = this._user != null && this._user.valid();
	var isFormatOk = this._format != null && this._format.valid();
	return isUserOk && isFormatOk;
};

Entry.prototype._setVClock = function() {
	var meta = {};
	meta.index = {user: this._user.id, formatId: this._format.id};
	this._updateVClockInMetadata(meta);
	return meta;
};

Entry.prototype.removeUserRelatedData = function(cb) {
	this.DS.removeEntriesWithSecondaryIndex('user', this._user.id, cb);
};

Entry.getDataStore = function() {
	return ds;
};

return Entry;

