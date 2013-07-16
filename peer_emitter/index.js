var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var WriteEmitter = require('./write_emitter');
var ReadEmitter = require('./read_emitter');

module.exports =
function createPeerEmitter(stream) {
  return new PeerEmitter(stream);
};

function PeerEmitter(stream) {
  EventEmitter.call(this);

  this.read = ReadEmitter(stream);
  this.write = WriteEmitter(stream);
}

inherits(PeerEmitter, EventEmitter);


/// addListener and on

PeerEmitter.prototype.addListener =
PeerEmitter.prototype.on =
function addListener(event, listener) {
  return this.read.on(event, listener);
};


/// once

PeerEmitter.prototype.once =
function once(event, listener) {
  return this.read.once(event, listener);
};


/// removeListener

PeerEmitter.prototype.removeListener =
function removeListener(event, listener) {
  return this.read.removeListener(event, listener);
};


/// removeAllListeners

PeerEmitter.prototype.removeAllListeners =
function removeAllListeners(event, listener) {
  return this.read.removeAllListeners(event);
};


/// read_emitter
PeerEmitter.prototype.emit =
function emit() {
  return this.write.emit.apply(this.write, arguments);
};