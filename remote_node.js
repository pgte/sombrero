var net = require('net');
var DBs = require('./remote_dbs');

module.exports = createRemoteNode;

function createRemoteNode(node, options) {
  return new RemoteNode(node, options);
}

function RemoteNode(node, options) {
  this.id = options.id;
  this.node = node;
  this.gossipPort = options.gossip;
  this.brokerPort = options.broker;
  this.host = options.host;
  this._options = options;
  this._ended = false;

  this.dbs = DBs(this);
}

RemoteNode.prototype.gossip = function gossip() {
  return net.connect(this.gossipPort);
};

RemoteNode.prototype.end = function end() {
  this._ended = true;
};

/// Advertising

RemoteNode.prototype.advertising = function() {
  return {
    id:     this.id,
    host:   this.host,
    gossip: this.gossipPort,
    type: 'node'
  };
};

