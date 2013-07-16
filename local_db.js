var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var level = require('level');
var mkdirp = require('mkdirp');

module.exports =
function createLocalDB(node, name, options) {
  return new LocalDB(node, name, options);
};

function LocalDB(node, name, options) {
  EventEmitter.apply(this);
  this.base = node._options.base + '/' + name;
  mkdirp.sync(this.base);

  this._closing = false;
  this._closed = false;

  this.db = level(this.base);

  this.db.once('ready', onReady.bind(this));
  this.db.once('closed', onClosed.bind(this));
}

inherits(LocalDB, EventEmitter);

function onReady() {
  this.emit('ready');
}


/// close

LocalDB.prototype.close = function close(cb) {
  if (! this._closing) {
    this._closing = true;
    this.db.close(cb);
  } else if (this._closed && cb) {
    cb()
  } else if (cb) {
    this.db.once('closed', cb);
  }
}

function onClosed() {
  this._closed = true;
  this.emit('closed');
}
