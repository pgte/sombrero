module.exports = createRemoteNode;

function createRemoteNode(options) {
  return new RemoteNode(options);
}

function RemoteNode(options) {
  this._options = options;
}