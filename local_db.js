var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var level = require('level');
var mkdirp = require('mkdirp');

var levelCreateOptions = {
  createIfMissing: true
};

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

  this.db = level(this.base, levelCreateOptions);

  this.db.once('ready', onReady.bind(this));
  this.db.once('closed', onClosed.bind(this));
}

inherits(LocalDB, EventEmitter);

function onReady() {
  this.emit('ready');
}


/// put

LocalDB.prototype.put = function put(key, value, cb) {
  value = JSON.stringify(value);
  this.db.put(key, value, cb);
};


/// get

LocalDB.prototype.get = function get(key, cb) {
  this.db.get(key, onGet.bind(this));

  function onGet(err, value) {
    if (err) {
      if (cb) cb(err);
      else this.emit('error', err);
    } else {
      if (value) value = JSON.parse(value);
      cb(null, value);
    }
  }
};

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
