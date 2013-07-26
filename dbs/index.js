var async = require('async');

var RemoteDB = require('./remote');
var LocalDB  = require('./local');
var ServerDB = require('./server');

module.exports = createDBs;

function createDBs(node, options) {
  return new DBs(node, options);
}

function DBs(node, options) {
  this.node = node;
  this._options = options;
  this._remoteDBs = {};
  this._localDBs = {};
  this._servers = {};
}

DBs.prototype.remote = function db(name, options) {
  var db = this._remoteDBs[name];
  if (! db) {
    db = this._remoteDBs[name] = RemoteDB(this.node, name, this._options);
    db.once('closed', onRemoteDbClosed.bind(this, name));
  }

  return db;
};

DBs.prototype.local = function local(name) {
  var db = this._localDBs[name];
  if (! db) {
    db = this._localDBs[name] = LocalDB(name, this._options);
    db.once('closed', onLocalDbClosed.bind(this, name));
  }

  return db;
};

DBs.prototype.server = function server(name) {
  var db = this._servers[name];
  if (! db) {
    db = this._servers[name] = ServerDB(this, name, this._options);
    db.once('close', onServerClosed.bind(this, name));
  }

  return db;
};


DBs.prototype.close = function close(cb) {
  var self = this;
  var doneCount = 0;
  async.each(Object.keys(this._remoteDBs), closeRemote, onDBsClosed);
  async.each(Object.keys(this._servers), closeServer, onDBsClosed);

  function onDBsClosed() {
    doneCount ++;
    if (doneCount == 2) async.each(Object.keys(self._localDBs), closeLocal, cb);
  }

  function closeRemote(dbName, cb) {
    var db = self._remoteDBs[dbName];
    db.once('closed', cb);
    db.close();
  }

  function closeServer(dbName, cb) {
    var db = self._servers[dbName];
    db.close(cb);
  }

  function closeLocal(dbName, cb) {
    var db = self._localDBs[dbName];
    db.once('closed', cb);
    db.close();
  }

};

function onRemoteDbClosed(name) {
  delete this._remoteDBs[name];
}

function onLocalDbClosed(name) {
  delete this._localDBs[name];
}

function onServerClosed(name) {
  delete this._servers[name];
}