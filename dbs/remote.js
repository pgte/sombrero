var LevelNetClient = require('level-net-client');

module.exports =
function createDB(node, name, host, port, options) {
  return new DB(node, name, options);
};

function DB(node, name, host, port, options) {
  var db = LevelNetClient();
  db.connect(port, host);
  return db;
}