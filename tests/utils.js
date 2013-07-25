var rimraf = require('rimraf');
exports.removeAllDBs = removeAllDBs;

function removeAllDBs() {
  var path = __dirname + '/../.sombrero';
  rimraf.sync(path);
}