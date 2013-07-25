var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var async = require('async');
var uuid  = require('node-uuid').v4;
var ip    = require('ip');

var DBs     = require('./dbs');
var Cluster = require('./cluster');
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
  this._options = options;
  this._ending = false;

  this.dbs       = DBs(this, options);
  this.meta      = Meta(this, options);
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
    node.dbs.close(cb);
  }
};