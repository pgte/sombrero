var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var async = require('async');
var uuid  = require('node-uuid').v4;
var ip    = require('ip');

var Cluster = require('./cluster');
var DB      = require('./db');
var Meta    = require('./meta');
var Gossip  = require('./gossip');
var Broker  = require('./broker');

module.exports =
function create(options) {
  return new Node(options);
};

function Node(options) {

  EventEmitter.call(this);

  this.id = options.id || uuid();

  this.host = ip.address();

  this._dbs = {};
  this._options = options;

  this._ending = false;

  this.meta    = Meta(options);
  this.localMeta = this.meta.sublevel('local');

  this.gossip  = Gossip (this, this._options);
  this.cluster = Cluster(this, this._options);
  this.broker  = Broker (this, this._options);

  init(this, onInitialized.bind(this));
}

inherits(Node, EventEmitter);


/// Initialization

function init(node, cb) {

  async.series([
      loadMeta.bind(node),
      saveMeta.bind(node)
    ],
    onDone);

  function onDone(err) {
    if (err) return node.emit('err', err);
    cb();
  }
}

function onInitialized(err) {
  if (err) return this.emit(err);

  var node = this;

  if (node._ending) return;

  async.series([
      node.gossip.load.bind(node.gossip),
      node.gossip.startServer.bind(node.gossip),
      node.broker.startServer.bind(node.broker)
    ], onDone);

  function onDone(err) {
    if (err) return node.emit('err', err);
    if (node._ending) return;
    node.emit('initialized');
    node.cluster.init();
    node.cluster.join();
  }
}


/// Metadata loading

function loadMeta(cb) {
  var self = this;

  var props = ['id', 'cluster'];

  async.map(props, load, onLoad);

  function load(key, cb) {
    self.localMeta.get(key, onGet);

    function onGet(err, value) {
      if (err && err.name == 'NotFoundError') err = null;
      cb(err, value);
    }
  }

  function onLoad(err, values) {
    if (err) return cb(err);

    props.forEach(makeSureTheSame);
    cb(err);

    function makeSureTheSame(prop, idx) {
      var oldValue = values[idx];
      var options = self._options;
      var option = options[prop];

      if (! err && oldValue && option && oldValue != option) {
        err = new Error('Changing ' + prop + ' is not permitted.' +
                        'Was ' + oldValue + ' and now is ' + option);
      }

      if (! err && oldValue) options['prop'] = oldValue;
    }
  }
}




/// Metadata saving

function saveMeta(cb) {
  var self = this;

  async.parallel([
      save('id', this.id),
      save('cluster', this._options.cluster)
    ], cb);

  function save(key, value) {
    return function(cb) {
      self.localMeta.put(key, value, cb);
    };
  }
}


/// Databases

Node.prototype.db = function db(name, options) {
  var db = this._dbs[name];
  if (! db) {
    db = this._dbs[name] = DB(this, name, options);
    db.once('closed', onDbClosed.bind(this, name));
  }

  return db;

};

function onDbClosed(name) {
  delete this._dbs[name];
}


/// close

Node.prototype.close = function close(cb) {
  var node = this;
  node._ending = true;

  var stoppers = [
    node.gossip.stopServer.bind(node.gossip),
    node.broker.stopServer.bind(node.broker)
  ];
  async.series(stoppers, onAllStopped);

  function onAllStopped() {
    async.each(Object.keys(node._dbs), close.bind(node), onAllDBsClosed);

    function close(dbName, cb) {
      var db = node._dbs[dbName];
      if (db) db.close(cb);
      else if (cb) process.nextTick(cb);
    }
  }

  function onAllDBsClosed() {
    if (cb) cb();
  }
};