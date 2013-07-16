var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var net = require('net');

var Peer = require('./peer');

module.exports =
function createDBServer(db) {
  return new DBServer(db);
  this.db = db;
  this.peers = [];
};

function DBServer(db) {
  EventEmitter.call(this);
};

inherits(DBServer, EventEmitter);

DBServer.prototype.listen = function listen(port, host, cb) {
  if (typeof host != 'string') {
    cb = host;
    host = undefined;
  }
  var server = this._getServer();
  server.listen(port, host, cb);
};


/// _getServer

DBServer.prototype._getServer = function _getServer() {
  if (! this._server) {
    var server = net.createServer();
    server.on('error', onError.bind(this));
    server.on('connection', onConnection.bind(this));
    this._server = server;
  }
  return this._server;

};

function onError(err) {
  this.emit('error', err);
}


/// onConnection

function onConnection(socket) {
  var peer = Peer(socket, this.db);
  this.peers.push(peer);
  socket.once('close', onConnectionClose);

  function onConnectionClose() {
    var idx = this.peers.indexOf(peer);
    if (idx >= 0) this.peers.splice(idx, 1);
  }
}
