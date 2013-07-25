var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var net = require('net');
var crdt = require('crdt');

module.exports = createGossip;

function createGossip(node, options) {
  return new Gossip(node, options);
}

function Gossip(node, options) {
  EventEmitter.call(this);

  this.node = node;
  this._options = options;

  this._listening = false;

  this.doc = crdt.Doc();
}

inherits(Gossip, EventEmitter);


/// Start and Stop Server

Gossip.prototype.startServer = function startServer(cb) {
  var self = this;

  if (! this.server) {
    var server = this.server = net.createServer(handleConnection.bind(this));

    server.once('listening', function() {
      self._listening = true;
    });

    server.listen(this._options.gossip, cb);
  }
};

function handleConnection(connection) {
  connection.pipe(this.doc.createStream()).pipe(connection);
}

Gossip.prototype.stopServer = function startServer(cb) {
  var server = this.server;
  if (server && this._listening) {
    this._listening = false;
    this.server = undefined;
    server.once('close', cb);
    server.close();
  } else cb();
};