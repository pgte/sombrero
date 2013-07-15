module.exports =
function createCluster(node, options) {
  return new Cluster(node, options);
}

function Cluster(node, options) {
  this.node = node;
  this.name = options.cluster;
}