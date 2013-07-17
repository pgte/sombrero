var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var net = require('net');

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
};


/// destroy

Client.prototype.destroy = function destroy() {
  this._socket.destroy();
};