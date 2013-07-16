var Cluster = require('./cluster');
var DB = require('./db');
var async = require('async');

module.exports =
function create(options) {
  return new Node(options);
};

function Node(options) {
  this.cluster = Cluster(this, options);
  this._dbs = {};
  this._options = options;
}


/// db

Node.prototype.db = function db(name, options) {
  var db = this._dbs[name];
  if (! db) {
    db = this._dbs[name] = DB(this, name, options);
    db.once('closed', onClosed.bind(this));
  }

  return db;

  function onClosed() {
    delete this._dbs[name];
  }
};


/// close

Node.prototype.close = function close(cb) {
  async.each(Object.keys(this._dbs), close.bind(this), onAllClosed);

  function close(dbName, cb) {
    var db = this._dbs[dbName];
    if (db) db.close(cb);
    else if (cb) process.nextTick(cb);
  }

  function onAllClosed() {
    if (cb) cb();
  }
};