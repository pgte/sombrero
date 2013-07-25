var sublevel = require('level-sublevel')

module.exports = createMeta;

function createMeta(node, options) {
  var db = node.dbs.local('_meta', options);
  sublevel(db);
  return db;
}