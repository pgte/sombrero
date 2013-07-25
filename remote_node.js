var net = require('net');

module.exports = createRemoteNode;

function createRemoteNode(options) {
  return new RemoteNode(options);
}

function RemoteNode(options) {
  this.id = options.id;
  this.gossipPort = options.gossip;
  this.host = options.host;
  this._options = options;
  this._ended = false;
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