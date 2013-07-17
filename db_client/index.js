var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var net = require('net');

var Peer = require('./peer');

module.exports =
function createClient() {
  return new Client();
};

function Client() {
  EventEmitter.call(this);
}

inherits(Client, EventEmitter);


/// connect

Client.prototype.connect = function connect(port, host, cb) {
  if (typeof host == 'function') {
    cb = host;
    host = undefined;
  }

  this._socket = net.connect(port, host, cb);
  this._socket.once('connect', onConnect.bind(this));

  this._peer = Peer(this._socket);
};


/// put

Client.prototype.put = function put(key, value, cb) {
  assert(this._peer, 'Not connected');
  this._peer.put(key, value, cb);
};


/// get

Client.prototype.get = function get(key, cb) {
  assert(this._peer, 'Not connected');
  this._peer.get(key, cb);
};


/// destroy

Client.prototype.destroy = function destroy() {
  this._socket.destroy();
};


/// onConnect

function onConnect() {
  this.emit('connect');
}