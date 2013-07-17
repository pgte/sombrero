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

  var socket = net.connect(port, host, cb);
  socket.setNoDelay(true);
  socket.once('connect', onConnect.bind(this));
  this._socket = socket;

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


/// createWriteStream

Client.prototype.createWriteStream = function createWriteStream(options) {
  assert(this._peer, 'Not connected');
  return this._peer.createWriteStream(options);
};


/// createReadStream

Client.prototype.createReadStream = function createReadStream(options) {
  assert(this._peer, 'Not connected');
  return this._peer.createReadStream(options);
};

/// createKeyStream

Client.prototype.createKeyStream = function createKeyStream(options) {
  assert(this._peer, 'Not connected');
  return this._peer.createKeyStream(options);
};

/// createValueStream

Client.prototype.createValueStream = function createValueStream(options) {
  assert(this._peer, 'Not connected');
  return this._peer.createValueStream(options);
};

/// destroy

Client.prototype.destroy = function destroy() {
  this._socket.destroy();
};


/// onConnect

function onConnect() {
  this.emit('connect');
}