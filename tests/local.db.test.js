var test = require('tap').test;

var Sombrero = require('../');

var node;
var db;

test('starts local db', function(t) {
  node = Sombrero.Node({
    cluster: 'mycluster',
    isolated: true
  });

  db = node.db('db1', { local: true });

  db.once('ready', function() {
    t.end();
  });

});

test('the same node name gets the same object', function(t) {
  var db2 = node.db('db1', { local: true });
  t.equal(db, db2);
  t.end();
});

test('closes node', function(t) {
  // here just to check if node.close can be called twice
  node.close();

  node.close(t.end.bind(t));
});