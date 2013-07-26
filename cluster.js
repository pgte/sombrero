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
  this.nodes = [];
}

Cluster.prototype.init = function() {
  var node = this.node;

  var nodes = node.gossip.doc.createSet('type', 'node');
  nodes.on('add', handleNewNode.bind(this));
  nodes.on('changes', handleChangedNode.bind(this));
  nodes.on('remove', handleRemovedNode.bind(this));
}

Cluster.prototype.join = function join() {
  var node = this.node.advertising();
  this.node.gossip.meet(node);
};

Cluster.prototype.locate = function locate(dbName) {
  var node = this.cycle.locate(dbName);
  return node;
};


// Node set change listeners coming from gossip

function handleNewNode(node) {
  if (node.id == this.node.id) node = this.node;
  else {
    node = RemoteNode(this.node, node.state);
    this.nodes.push(node);
  }
  this.cycle.add(node, node.id);
}

function handleChangedNode(node, changed) {
  /// Not really sure what to do here
}

function handleRemovedNode(node) {
  var idx = findNode.call(this, node);
  var node = this.nodes[idx];
  node.end();
  this.cycle.remove(node.id);
  if (idx >= 0) this.nodes.splice(idx, 1);
}

function findNode(_node) {
  for (var i = 0, node ; i < this.nodes.length; i ++) {
    node = nodes[i];
    if (node.id == _node.id) return i;
  }
  return -1;
}