var LightCycle = require('light-cycle');
var RemoteNode = require('./remote_node');

module.exports =
function createCluster(node, options) {
  return new Cluster(node, options);
}

function Cluster(node, options) {
  this._options = options;
  this.node = node;
  this.name = options.cluster;
  this.cycle = new LightCycle({ seed: 0xcafebabe, size: 3 });
  this.meta = node.meta;
}

Cluster.prototype.init = function() {
  var node = this.node;

  this.nodes = node.gossip.doc.createSet('type', 'node');
  this.nodes.on('add', handleNewNode.bind(this));
  this.nodes.on('changes', handleChangedNode.bind(this));
  this.nodes.on('remove', handleRemovedNode.bind(this));
}

Cluster.prototype.join = function join() {
  console.log('node %s is joining cluster %s', this.node.id, this.name);
  this.node.gossip.doc.add({
    id:   this.node.id,
    host: this.node.host,
    port: this._options.broker,
    type: 'node'
  });
};

Cluster.prototype.locate = function locate(dbName) {
  this.cycle.locate(dbName);
};


// Node set change listeners coming from gossip

function persistNodes() {
  var self = this;
  var nodes = this.nodes.asArray();
  this.meta.put('nodes', nodes, onNodesSaved);

  function onNodesSaved(err) {
    if (err) self.emit('error', err);
  }
}

function handleNewNode(node) {
  if (node.id != this.node.id) {
    console.log('new node joined', node.state);
  }

  var remoteNode = RemoteNode(node);

  this.cycle.add(remoteNode, node.id);
  persistNodes.call(this);
}

function handleChangedNode(node, changed) {
  /// Not really sure what to do here
  persistNodes.call(this);
}

function handleRemovedNode(node) {
  console.log('node leaving', node.id);
  this.cycle.remove(node.id);
  persistNodes.call(this);
}