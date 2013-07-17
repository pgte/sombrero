var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var extend = require('util')._extend;
var duplexEmitter = require('duplex-emitter');
var uuid = require('node-uuid').v4;
var slice = Array.prototype.slice;

var defaultOptions = {
  timeout: 5000
};

module.exports =
function createPeer(stream, options) {
  return new Peer(stream);
};

function Peer(stream, options) {

  if (! options) options = {};
  var opts = extend({}, defaultOptions);
  this.options = extend(opts, options);

  this._stream = stream;
  this._server = duplexEmitter(stream);
  this._requests = {};
  this._timeouts = {};

  this._server.on('error', onError.bind(this));
  this._server.on('ok', onOk.bind(this));
  this._server.on('got', onGot.bind(this));
};

inherits(Peer, EventEmitter);


/// addRequest

function addRequest(id, cb) {
  if (cb) this._requests[id] = cb;
  var timeout = setTimeout(requestTimeout.bind(this, id),
                           this.options.timeout);
  this._timeouts[id] = timeout;
}


/// endRequest

function endRequest(id, err) {
  var timeout = this._timeouts[id];
  if (timeout) {
    clearTimeout(timeout);
    delete this._timeouts[id];
  }

  var cb = this._requests[id];
  if (cb) {
    delete this._requests[id];
    var args = slice.call(arguments, 1);
    cb.apply(null, args);
  } else if(err) {
    this.emit('error', err);
  }
}


/// requestTimeout

function requestTimeout(id) {
  var err = new Error('request timedout');
  endRequest.call(this, id, err);
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
