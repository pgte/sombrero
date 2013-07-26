var level = require('level');
var mkdirp = require('mkdirp');

var levelCreateOptions = {
  createIfMissing: true
};

module.exports =
function createLocalDB(name, options) {
  var base = options.base + '/' + name;
  mkdirp.sync(base);
  return level(base, levelCreateOptions);
};