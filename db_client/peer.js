var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var duplexEmitter = require('duplex-emitter');
var uuid = require('node-uuid').v4;
var slice = Array.prototype.slice;

module.exports =
function createPeer(stream) {
  return new Peer(stream);
};

function Peer(stream) {
  this._stream = stream;
  this._server = duplexEmitter(stream);
  this._requests = {};

  this._server.on('error', onError.bind(this));
  this._server.on('ok', onOk.bind(this));
  this._server.on('got', onGot.bind(this));
};

inherits(Peer, EventEmitter);


/// addRequest

function addRequest(id, cb) {
  if (cb) this._requests[id] = cb;
}


/// endRequest

function endRequest(id, err) {
  var cb = this._requests[id];
  if (cb) {
    delete this._requests[id];
    var args = slice.call(arguments, 1);
    cb.apply(null, args);
  } else if(err) {
    this.emit('error', err);
  }
}

/// put

Peer.prototype.put = function put(key, value, cb) {
  var id = uuid();
  addRequest.call(this, id, cb);
  this._server.emit('put', id, key, value);
};


/// get

Peer.prototype.get = function get(key, cb) {
  var id = uuid();
  addRequest.call(this, id, cb);
  this._server.emit('get', id, key);
};


/// onError

function onError(reqId, message, stack) {
  var err = new Error(message);
  err.stack = stack;
  endRequest.call(this, reqId, err);
};


/// onOk

function onOk(reqId) {
  endRequest.call(this, reqId);
}


/// onGot

function onGot(reqId, value) {
  endRequest.call(this, reqId, null, value);
}
