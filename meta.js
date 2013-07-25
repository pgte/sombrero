var sublevel = require('level-sublevel')
var LocalDb = require('./local_db');

module.exports = createMeta;


function createMeta(options) {
  var db = LocalDb('_meta', options);
  sublevel(db);
  return db;
}