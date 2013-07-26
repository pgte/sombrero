var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var net = require('net');
var crdt = require('crdt');
var levelScuttlebutt = require('level-scuttlebutt');

module.exports = createGossip;

function createGossip(node, options) {
  return new Gossip(node, options);
}

function Gossip(node, options) {

  EventEmitter.call(this);

  this.node = node;
  this.port = options.gossip;

  this._options = options;

  this._listening = false;

  this.db = node.meta.sublevel('gossip');
  levelScuttlebutt(this.db, node.id, getGossipDoc.bind(this));

  var gossip = this;
}

inherits(Gossip, EventEmitter);


function getGossipDoc(docName) {
  assert.equal(docName, 'gossip');
  return new crdt.Doc();
}


/// Load

Gossip.prototype.load = function load(cb) {
  var self = this;

  this.db.open('gossip', function(err, doc) {
    if (err) return self.emit('error', err);
    self.doc = doc;
    self.emit('loaded');
    cb();
  });
};


/// Disseminator

Gossip.prototype.startDisseminator = function startDisseminator() {
  scheduleDisseminator.call(this);
}

function scheduleDisseminator() {
  assert(! this.disseminator, 'disseminator overlapping');
  var timeout = randomTimeout.call(this);
  this.disseminator = setTimeout(disseminate.bind(this), timeout);
}

function randomTimeout() {
  var average = this._options.gossip_disseminate_interval;
  var dev = average / 2;
  return dev + Math.random() * average;
}

function disseminate() {
  this.disseminator = null;
  scheduleDisseminator.call(this);

  var nodes = this.node.cluster.nodes;
  if (nodes && nodes.length && this.doc) {
    var idx = Math.floor(Math.random() * nodes.length);
    var node = nodes[idx];
    if (node != this.node) {
      var stream = node.gossip();
      var docStream = this.doc.createStream();

      var timeout = setTimeout(handleDisseminateTimeout.bind(this, node),
                               this._options.gossip_timeout);

      docStream.once('sync', function() {
        docStream.end();
        clearTimeout(timeout);
      });

      docStream.on('error', onDisseminateError.bind(this));
      stream.on('error', onDisseminateError.bind(this));

      stream.pipe(docStream).pipe(stream);
    }
  }
}

function handleDisseminateTimeout(node) {
  var err =new Error('Disseminate timeout contacting node ' +
                      JSON.stringify(node.advertising()));
  onDisseminateError.call(this, err);
}

function onDisseminateError(err) {
  console.error('disseminate error:', err.stack || err);
}

Gossip.prototype.stopDisseminator = function stopDisseminator() {
  clearTimeout(this.disseminator);
}

/// Meet

Gossip.prototype.meet = function meet(node, cb) {
  if (this.doc) {
    this.doc.add(node);
    if (cb) cb();
  } else {
    this.once('loaded', function() {
      this.doc.add(node);
      if (cb) cb();
    });
  }
};

/// Start and Stop Server

Gossip.prototype.startServer = function startServer(cb) {
  var self = this;

  if (! this.server) {
    var server = this.server = net.createServer(handleConnection.bind(this));

    server.once('listening', function() {
      self._listening = true;
    });

    server.listen(this._options.gossip, cb);
  }
};

function handleConnection(connection) {
  connection.pipe(this.doc.createStream()).pipe(connection);
}

Gossip.prototype.stopServer = function stopServer(cb) {
  var server = this.server;
  if (server && this._listening) {
    this._listening = false;
    this.server = undefined;
    server.once('close', cb);
    server.close();
  } else cb();
};