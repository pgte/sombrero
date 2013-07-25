var extend = require('util')._extend;
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var LocalDB = require('./local_db');

var defaultOptions = {
  w: 2,
  r: 2,
  n: 3
};

module.exports =
function createDB(node, name, options) {
  return new DB(node, name, options);
};

function DB(node, name, options) {
  this.node = node;
  this.name = name;

  // Options

  if (! options) options = {};
  var defOptions = extend({}, defaultOptions);
  var options = extend(defOptions, options);

  this._options = options;

  this._writeOptions = {
    n: options.n,
    w: options.w
  };

  this._readOptions = {
    r: options.r
  };

  // Local

  this.isLocal = node._options.isolated;

  if (this.isLocal) this.makeLocal();

}

inherits(DB, EventEmitter);

/// makeLocal

DB.prototype.makeLocal = function makeLocal() {
  this.local = LocalDB(this.name, this._options);
  this.local.once('ready', onReady.bind(this));
  this.local.once('closed', onClosed.bind(this));

};

function onReady() {
  this.emit('ready');
}


/// put

DB.prototype.put = function put(key, value, options, cb) {
  if (typeof options != 'object') {
    cb = options;
    options = undefined;
  }
  if (! this.node._options.isolated) {
    if (! options) options = {};
    var defOptions = extend({}, this._writeOptions);
    options = extend(defOptions, options);
    this.remotes.put(key, value, options, onRemotePut);
  } else if (this.isLocal) {
    putLocal.call(this);
  } else {
    error(new Error('Isolated and not local'));
  }

  function onRemotePut(err) {
    if (err) {
      if (cb) cb(err);
      else this.emit('error', err);
    } else putLocal.call(this);
  }

  function putLocal() {
    this.local.put(key, value, onPutLocal.bind(this));
  }

  function onPutLocal(err) {
    if (err) error(err)
    else if (cb) cb();
  }

  function error(err) {
    if (cb) cb(err);
    else this.emit('error', err);
  }

};


/// get

DB.prototype.get = function get(key, options, cb) {
  if (typeof options != 'object') {
    cb = options;
    options = undefined;
  }

  if (! this.node._options.isolated) {
    if (! options) options = {};
    var defOptions = extend({}, this._readOptions);
    options = extend(defOptions, options);
    this.remotes.get(key, options, onRemoteGet);
  } else if (this.isLocal) {
    getLocal.call(this);
  } else {
    error(new Error('Isolated and not local'));
  }

  function onRemoteGet(err, value) {
    if (err) error(err);
    // PENDING: READ REPAIRS!!!!
    else getLocal.call(this);
  }

  function getLocal() {
    this.local.get(key, cb);
  }

  function error(err) {
    if (cb) cb(err);
    else this.emit('error', err);
  }

};


/// createWriteStream

DB.prototype.createWriteStream = function createWriteStream(options) {
  if (! this.node._options.isolated) {
    // PENDING
  } else if (this.isLocal) {
    return this.local.createWriteStream(options);
  } else error(new Error('Isolated and not local'));

  function error(err) {
    if (cb) cb(err);
    else this.emit('error', err);
  }
};


/// createReadStream

DB.prototype.createReadStream = function createReadStream(options) {
  if (! this.node._options.isolated) {
    // PENDING
  } else if (this.isLocal) {
    return this.local.createReadStream(options);
  } else error(new Error('Isolated and not local'));

  function error(err) {
    if (cb) cb(err);
    else this.emit('error', err);
  }
};


/// createKeyStream

DB.prototype.createKeyStream = function createKeyStream(options) {
  if (! this.node._options.isolated) {
    // PENDING
  } else if (this.isLocal) {
    return this.local.createKeyStream(options);
  } else error(new Error('Isolated and not local'));

  function error(err) {
    if (cb) cb(err);
    else this.emit('error', err);
  }
}


/// createValueStream

DB.prototype.createValueStream = function createValueStream(options) {
  if (! this.node._options.isolated) {
    // PENDING
  } else if (this.isLocal) {
    return this.local.createValueStream(options);
  } else error(new Error('Isolated and not local'));

  function error(err) {
    if (cb) cb(err);
    else this.emit('error', err);
  }
}

/// close

DB.prototype.close = function close(cb) {
  if (this.local) {
    this.local.close(cb);
  } else if (cb) process.nextTick(cb);
};

function onReady() {
  this.emit('ready');
}

function onClosed() {
  this.emit('closed');
}