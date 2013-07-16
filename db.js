var extend = require('util')._extend;
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var LocalDB = require('./local_db');

var defaultOptions = {};

module.exports =
function createDB(node, name, options) {
  return new DB(node, name, options);
};

function DB(node, name, options) {
  this.node = node;
  this.name = name;

  if (! options) options = {};
  var defOptions = extend({}, defaultOptions);
  var options = extend(defOptions, options);

  this._options = options;

  if (options.local) this.makeLocal();
}

inherits(DB, EventEmitter);

/// makeLocal

DB.prototype.makeLocal = function makeLocal() {
  this.local = LocalDB(this.node, this.name, this._options);
  this.local.once('ready', onReady.bind(this));
  this.local.once('closed', onClosed.bind(this));

};

function onReady() {
  this.emit('ready');
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