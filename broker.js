var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var net = require('net');

module.exports = createBroker;

function createBroker(node, options) {
  return new Broker(node, options);
}

function Broker(node, options) {
  EventEmitter.call(this);

  this.node = node;
  this.port = options.broker;
  this._options = options;
}

inherits(Broker, EventEmitter);

/// Start and Stop Server

Broker.prototype.startServer = function startServer(cb) {
  var self = this;

  if (! this.server) {
    var server = this.server = net.createServer();

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