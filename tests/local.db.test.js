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

test('can put and get', function(t) {
  var name = 'Sombrero_' + Date.now();
  db.put('name', name, onPut);

  function onPut(err) {
    if (err) throw err;
    db.get('name', onGet);
  }

  function onGet(err, value) {
    if (err) throw err;
    t.equal(value, name);
    t.end();
  }
});

test('can put without callback', function(t) {
  var name = 'Sombrero_' + Date.now();
  db.put('name', name);

  setTimeout(function() {
    db.get('name', onGet);
  }, 100);

  function onGet(err, value) {
    if (err) throw err;
    t.equal(value, name);
    t.end();
  }

});

test('closes node', function(t) {
  // the followint 2 lines are here just to check
  // if db.close can be called twice
  db.close();
  node.close();

  // verifying that we get calledback after closing
  setTimeout(function() {
    node.close(t.end.bind(t));
  }, 500);
});