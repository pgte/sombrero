var Options = require('./options');
var Node = require('./node');

exports.Node =
exports.node =
function createNode(options) {
  options = Options(options);
  return Node(options);
};