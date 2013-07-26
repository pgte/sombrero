var LevelNetClient = require('level-net-client');

module.exports =
function createDB(name) {
  return new DB(name);
};

function DB(name) {
  return LevelNetClient();
}