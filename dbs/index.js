var async = require('async');

var DB = require('./db');
var LocalDB = require('./local_db');

module.exports = createDBs;

function createDBs(node, options) {
  return new DBs(node, options);
}

function DBs(node, options) {
  this.node = node;
  this._dbs = {};
  this._localDBs = {};
}

DBs.prototype.db = function db(name, options) {
  var db = this._dbs[name];
  if (! db) {
    db = this._dbs[name] = DB(this.node, name, options);
    db.once('closed', onDbClosed.bind(this, name));
  }

  return db;
};

DBs.prototype.local = function local(name, options) {
  var db = this._localDBs[name];
  if (! db) {
    db = this._localDBs[name] = LocalDB(name, options);
    db.once('closed', onLocalDbClosed.bind(this, name));
  }

  return db;
};

DBs.prototype.close = function close(cb) {
  var self = this;
  async.each(Object.keys(this._dbs), close, onDBsClosed);

  function onDBsClosed() {
    async.each(Object.keys(self._localDBs), closeLocal, cb);
  }

  function close(dbName, cb) {
    var db = self._dbs[dbName];
    db.once('closed', cb);
    db.close();
  }

  function closeLocal(dbName, cb) {
    var db = self._localDBs[dbName];
    db.once('closed', cb);
    db.close();
  }

};

function onDbClosed(name) {
  delete this._dbs[name];
}

function onLocalDbClosed(name) {
  delete this._localDBs[name];
}