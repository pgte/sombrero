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
  client.put(prefix + 'k001', 'v001', onPut);

  function onPut(err) {
    if (err) throw err;
    t.end();
  }
});

test('client gets', function(t) {
  client.get(prefix + 'k001', onGet);

  function onGet(err, value) {
    if (err) throw err;
    t.deepEqual(value, 'v001');
    t.end();
  }
});

test('client can create a write stream', function(t) {
  var s = client.createWriteStream();
  for (var i = 1 ; i <= 100; i ++) {
    var suffix = pad(i);
    s.write({key: prefix + 'k' + suffix, value: 'v' + suffix}, onWrite1);
  }

  var wrote = 0;
  function onWrite1(err) {
    if (err) throw err;
    wrote ++;
    if (wrote == 100) done1();
  }

  function done1() {
    setTimeout(function() {
      for (var i = 101 ; i <= 200; i ++) {
        var suffix = pad(i);
        s.write({key: prefix + 'k' + suffix, value: 'v' + suffix}, onWrite2);
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

test('client can create a read stream', function(t) {
  var s = client.createReadStream({
    start: prefix,
    end: prefix + 'v200'
  });

  var i = 0;
  s.on('data', function(d) {
    i ++;
    var suffix = pad(i);
    var expectedKey = prefix + 'k' + suffix;
    t.deepEqual(d.key, expectedKey);

    var expectedValue = 'v' + suffix;
    t.deepEqual(d.value, expectedValue);
  });

  s.once('end', function() {
    t.equal(i, 200);
    t.end();
  });

});

test('can create a key stream', function(t) {
  var s = client.createKeyStream({
    start: prefix,
    end: prefix + 'v200'
  });

  var i = 0;
  s.on('data', function(d) {
    i ++;
    var suffix = pad(i);
    var expectedKey = prefix + 'k' + suffix;
    t.deepEqual(d, expectedKey);
  });

  s.once('end', function() {
    t.equal(i, 200);
    t.end();
  });
});

test('closes node, client and server', function(t) {
  client.destroy();
  server.close();
  node.close(t.end.bind(t));
});

function xtest() {}

function pad(n) {
  var s = n.toString();
  if (n < 10) s = '0' + s;
  if (n < 100) s = '0' + s;
  return s;
}