var mkdirp = require('mkdirp');
var Sombrero = require('../');

module.exports = Horde;

function Horde(count, cluster, baseDir) {
  var pack = [];

  for(var i = 0, node; i < count; i ++) {
    node = createNode(cluster, baseDir, i);
    pack.push(node)
  }
  return pack;
}

function createNode(cluster, baseDir, i) {
  var dbDir = baseDir + '/' + i;
  mkdirp.sync(dbDir);
  var options = {
    cluster: cluster,
    base:    dbDir,
    gossip:  9271 + i * 2,
    broker:  9272 + i * 2,
    gossip_disseminate_interval: 100
  };

  var node = Sombrero.Node(options);

  return node;
}