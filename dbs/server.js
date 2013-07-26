var EventEmitter = require('events').EventEmitter;
var inherits     = require('util').inherits;
var LevelServer  = require('level-net-server');

module.exports = createServer;

function createServer(dbs, name, options) {
  return new DBServer(dbs, name, options);
}

function DBServer(dbs, name, options) {
  this._options = options;
  this._dbs  = dbs;
  this.name  = name;
  this.state = 'disconnected';
  this.port  = undefined;
  this.host  = undefined;
}

inherits(DBServer, EventEmitter);

DBServer.prototype.listen = function listen(port, host, cb) {
  if (this.state != 'disconnected') throw new Error('server is ' + this.state);

  if (typeof host != 'string') {
    cb = host;
    host = undefined;
  }

  this.state = 'listen';
  this.port = port,
  this.host = host;

  var server = getServer.call(this);
  if (cb) server.once('listening', cb.bind(null, port, host));
  server.listen(port, host);

  function onListen() {
    this.state = 'listening';
    this.emit('listening', port, host);
    cb(null, port, host);
  }
};


function getServer() {
  var db = getDB.call(this);
  var server = this._server;
  if (! server)
    server = this._server = LevelServer(db)

  return server;
}

function getDB() {
  var db = this.db
  if (! db)
    db = this.db = this._dbs.local(this.name, this._options);

  return db;
}

DBServer.prototype.close = function close(cb) {
  if (this._server) this._server.close(cb)
  else cb();
}