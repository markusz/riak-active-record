module.exports = {
  extractIndexesFromMetadata: function(meta) {
    var indexes = {};
    var regex = /^x-riak-index-(.*)$/;
    for (var key in meta.headers) {
      var matches = key.match(regex);
      if (matches) {
        indexes[matches[1]] = meta.headers[key];
      }
    }
    return indexes;
  }
};