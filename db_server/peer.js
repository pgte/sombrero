var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var PeerEmitter = require('../peer_emitter');

module.exports =
function createPeer(stream, node, db) {
  return new Peer(stream, node, db);
};

function Peer(stream, node, db) {
  EventEmitter.call(this);

  var emitter = PeerEmitter(stream);
  this._emitter = emitter;

  this.node = node;
  this.db = db;

  emitter.on('put', onPut.bind(this));
  emitter.on('get', onGet.bind(this));
}

inherits(Peer, EventEmitter);


/// put

function onPut(requestId, key, value) {
  this.db.put(key, value, onPut.bind(this));

  function onPut(err) {
    if (err) error.call(this, err, requestId);
    else this._emitter.emit('ok', requestId);
  }
}


/// get

function onGet(requestId, key) {
  this.db.get(key, onGet.bind(this));

  function onGet(err, value) {
    if (err) error.call(this, err, requestId);
    else this._emitter.emit('got', requestId, value);
  }
};

// error

function error(requestId, err) {
  this._emitter.emit('error', requestId, err.message, err.stack);
}