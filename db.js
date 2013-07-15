var level = require('level');

module.exports =
function createDB(node, options) {
  return DB(node, options);
};

function DB(node, options) {
  if (! this instanceof DB) return new DB(node, options);

  this.node = node;
  this._options = options;
}