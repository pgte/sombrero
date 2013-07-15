var Cluster = require('./cluster');
var DB = require('./db');

module.exports =
function create(options) {
  return new Node(options);
};

function Node(options) {
  this.cluster = Cluster(this, options);
  this.db = DB(this);
}