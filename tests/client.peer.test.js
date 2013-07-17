var test = require('tap').test;

var Sombrero = require('../');
var Server = require('../db_server');
var Client = require('../db_client');

var node;
var db;
var prefix;
var port;
var server;
var client;

test('starts local db', function(t) {
  node = Sombrero.Node({
    cluster: 'mycluster',
    isolated: true
  });

  db = node.db('db1', { local: true });

  db.once('ready', function() {
    t.end();
  });

  prefix = Date.now().toString() + ':';
});

test('starts a server', function(t) {
  port = Math.floor(Math.random() * (65535 - 49152) + 49152);
  server = Server(db);
  server.listen(port, t.end.bind(t));
});

test('client connects', function(t) {
  client = Client();
  client.connect(port, t.end.bind(t));
});

test('client puts', function(t) {
  client.put(prefix + 'k1', 'v1', onPut);

  function onPut(err) {
    if (err) throw err;
    t.end();
  }
});

test('client gets', function(t) {
  client.get(prefix + 'k1', onGet);

  function onGet(err, value) {
    if (err) throw err;
    t.deepEqual(value, 'v1');
    t.end();
  }
});

test('client can create a write stream', function(t) {
  var s = client.createWriteStream();
  for (var i = 0 ; i < 100; i ++) {
    s.write({key: prefix + 'k' + i, value: 'v' + i}, onWrite1);
  }

  var wrote = 0;
  function onWrite1(err) {
    // console.log('wrote');
    if (err) throw err;
    wrote ++;
    if (wrote == 100) done1();
  }

  function done1() {
    setTimeout(function() {
      for (var i = 100 ; i < 200; i ++) {
        s.write({key: prefix + 'k' + i, value: 'v' + i}, onWrite2);
      }
      s.end();
    }, 100);
  }

  function onWrite2(err) {
    if (err) throw err;
    wrote ++;
  }

  s.on('close', function() {
    t.equal(wrote, 200);
    t.end();
  });

});

test('closes node, client and server', function(t) {
  client.destroy();
  server.close();
  node.close(t.end.bind(t));
});

function xtest() {}