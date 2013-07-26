var EventEmitter  = require('events').EventEmitter;
var inherits      = require('util').inherits;
var net           = require('net');
var DuplexEmitter = require('duplex-emitter');
var emptyPort     = require('empty-port');

module.exports = createBroker;

function createBroker(node, options) {
  return new Broker(node, options);
}

function Broker(node, options) {
  EventEmitter.call(this);

  this.node = node;
  this.port = options.broker;
  this._options = options;

  this.db = node.meta.sublevel('broker');

  this._servers = {};
}

inherits(Broker, EventEmitter);

/// Start and Stop Server

Broker.prototype.startServer = function startServer(cb) {
  var self = this;

  if (! this.server) {
    var server = this.server = net.createServer(handleConnection.bind(this));

    server.once('listening', function() {
      self._listening = true;
    });

    server.listen(this._options.broker, cb);
  }
};

Broker.prototype.stopServer = function startServer(cb) {
  var server = this.server;
  if (server && this._listening) {
    this._listening = false;
    this.server = undefined;
    server.once('close', cb);
    server.close();
  } else cb();
};


/// Handle Connection

function handleConnection(connection) {
  var peer = DuplexEmitter(connection);

  handlePeer.call(this, peer);
}

function handlePeer(peer) {
  peer.on('db', onDb.bind(this, peer));
}

// Peer asks us for DB remote reference
function onDb(peer, reqId, dbName) {
  var server = this._servers[dbName];
  if (! server) {
    var server = this.node.dbs.server(dbName);
    var host = this.node.host;
    getPort.call(this, host, function(err, port) {
      if (err) peer.emit('error', err);
      else server.listen(port, host, onListen.bind(this, peer, reqId, dbName));
    });
  } else {
    if (server.state != 'listening') {
      server.once('listening', onListen.bind(this, peer, reqId, dbName));
    } else {
      replyToDB.call(this, peer, reqId, dbName, server.port, server.host);
    }
  }

}

function onListen(peer, reqId, dbName, port, host) {
  replyToDB.call(this, peer, reqId, dbName, port, host);
}

function replyToDB(peer, reqId, dbName, port, host) {
  peer.emit('db', reqId, dbName, port, host);
}

function getPort(host, cb) {
  var emptyPortOptions = {
    startPort: this._options.ephemeral_port_begin,
    maxPort: this._options.ephemeral_port_end,
    host: host
  };
  emptyPort(emptyPortOptions, cb);
}