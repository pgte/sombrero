var assert = require('assert');
var net = require('net');
var DuplexEmitter = require('duplex-emitter');
var uuid = require('node-uuid').v4;

module.exports = createRemoteDBS;

function createRemoteDBS(node) {
  return new RemoteDbs(node);
}

function RemoteDbs(node) {
  this.remoteNode = node;
}

RemoteDbs.prototype.remote = function(name) {
  var db = this.remoteNode.node.dbs.remote(name);
  var conn = net.connect(this.remoteNode.brokerPort, this.remoteNode.host)
  var broker = DuplexEmitter(conn);

  /// TODO: improve this
  var reqId = uuid();
  broker.emit('db', reqId, name);

  broker.once('db', function(reqId, dbName, port, host) {
    assert.equal(dbName, name);
    conn.destroy();
    db.connect(port, host);
  });

  return db;
}