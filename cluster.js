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

  var nodes = node.gossip.doc.createSet('type', 'node');
  nodes.on('add', handleNewNode.bind(this));
  nodes.on('changes', handleChangedNode.bind(this));
  nodes.on('remove', handleRemovedNode.bind(this));

}

Cluster.prototype.join = function join() {
  var node = {
    id:     this.node.id,
    host:   this.node.host,
    gossip: this.node.gossip.port,
    broker: this.node.broker.port,
    type: 'node'
  };
  console.log('node is joining cluster %s %j', this.name, node);
  this.node.gossip.doc.add(node);
};

Cluster.prototype.locate = function locate(dbName) {
  this.cycle.locate(dbName);
};


// Node set change listeners coming from gossip

function handleNewNode(node) {
  if (node.id != this.node.id) {
    console.log('new node joined', node.state);
  }

  var remoteNode = RemoteNode(node);

  this.cycle.add(remoteNode, node.id);
}

function handleChangedNode(node, changed) {
  /// Not really sure what to do here
}

function handleRemovedNode(node) {
  console.log('node leaving', node.id);
  this.cycle.remove(node.id);
}