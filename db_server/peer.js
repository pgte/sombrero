var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var DuplexEmitter = require('duplex-emitter');

module.exports =
function createPeer(stream, db) {
  return new Peer(stream, db);
};

function Peer(stream, db) {
  EventEmitter.call(this);

  var emitter = DuplexEmitter(stream);
  this._emitter = emitter;

  this._streams = {};

  this.db = db;

  emitter.on('put', onPut.bind(this));
  emitter.on('get', onGet.bind(this));
  emitter.on('read', onRead.bind(this));
  emitter.on('writeStream', onWriteStream.bind(this));
  emitter.on('write', onWrite.bind(this));
  emitter.on('end', onEnd.bind(this));
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


/// read

function onRead(requestId, options) {
  var readStream = this.db.createReadStream(options);
  readStream.on('data', onData.bind(this));
  readStream.once('end', onEnd.bind(this));

  function onData(d) {
    this._emitter.emit('data', requestId, d);
  }

  function onEnd(d) {
    this._emitter.emit('end', requestId);
  }
}


/// writeStream

function onWriteStream(requestId, options) {
  var writeStream = this.db.createWriteStream(options);
  this._streams[requestId] = writeStream;
  writeStream.once('close', onClose.bind(this));

  function onClose() {
    this._emitter.emit('close', requestId);
    delete this._streams[requestId];
  }
}


/// write

function onWrite(requestId, what) {
  var stream = this._streams[requestId];
  if (! stream) {
    error.call(this, requestId, new Error('Stream not found'));
  } else {
    stream.write(what);

    // PENDING: should only send ack
    // when write is acknowledged
    process.nextTick(onReady.bind(this));

    //stream.once('drain', onDrain.bind(this));
  }

  // function onDrain() {
  //   this._emitter.emit('ack', requestId);
  // }
  function onReady() {
    this._emitter.emit('ack', requestId);
  }
}


/// end

function onEnd(requestId, what) {
  var stream = this._streams[requestId];
  if (! stream) {
    error.call(this, requestId, new Error('Stream not found'));
  } else {
    stream.end(what);
  }
}

// error

function error(requestId, err) {
  this._emitter.emit('error', requestId, err.message, err.stack);
}