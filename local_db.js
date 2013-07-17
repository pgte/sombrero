var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var level = require('level');
var mkdirp = require('mkdirp');
var combine = require('stream-combiner');
var through = require('through');

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


/// createWriteStream

LocalDB.prototype.createWriteStream = function createWriteStream(options) {
  var s = this.db.createWriteStream(options);
  return combine(createEncodeValueStream(), s);
};


/// createReadStream

LocalDB.prototype.createReadStream = function createReadStream(options) {
  var s = this.db.createReadStream(options);
  if (options && options.values) {
    s = combine(s, createParseStream());
  } else if (! options || ! options.keys) {
    s = combine(s, createValuesParseStream());
  }
  return s;
};


/// createKeyStream

LocalDB.prototype.createKeyStream = function createKeyStream(options) {
  return this.db.createKeyStream(options);
};


/// createValueStream

LocalDB.prototype.createValueStream = function createValueStream(options) {
  var s = combine(this.db.createValueStream(options), createParseStream());
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


/// encodeValueStream

function createEncodeValueStream() {
  return through(encodeValueStream);
}

function encodeValueStream(d) {
  if (d) {
    if (d.value) d.value = JSON.stringify(d.value);
    this.queue(d);
  }
}

/// parseStream

function createParseStream() {
  return through(parseStream);
}

function parseStream(d) {
  this.queue(JSON.parse(d));
}

function createValuesParseStream() {
  return through(parseValuesStream);
}

function parseValuesStream(d) {
  d.value = JSON.parse(d.value);
  this.queue(d);
}