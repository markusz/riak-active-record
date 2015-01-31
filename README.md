# riak-active-record
A npm module that enables a simple usage of the ActiveRecord pattern for Riak.

Just let your own model inherit from riak_record to use the following database operations
* load
* save
* delete
* update
* mapReduce
* secondaryIndexes

The module takes care of setting 2i indexes etc. in the background
