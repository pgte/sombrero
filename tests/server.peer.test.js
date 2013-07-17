var test = require('tap').test;

var Sombrero = require('../');
var ServerPeer = require('../db_server/peer');
var AttachedStream = require('./attached_stream');

var node;
var db;
var prefix;

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

test('can put', function(t) {

  var streams = AttachedStream();
  var serverPeer = ServerPeer(streams.server, db);

  var requestId = 1;
  streams.client.write(JSON.stringify(['put', requestId ++, prefix + 'A', 'v1']) + '\n');
  streams.client.write(JSON.stringify(['put', requestId ++, prefix + 'B', 'v2']) + '\n');

  var replies = [];
  streams.client.on('data', function(d) {
    replies.push(d);
    t.ok(replies.length <= 2);
    if (replies.length == 2) done()
  });

  function done() {
    replies.sort();
    var expectedReplies = [
      JSON.stringify(['ok', 1]) + '\n',
      JSON.stringify(['ok', 2]) + '\n'
    ];
    t.deepEqual(replies, expectedReplies);
    t.end();
  }
});

test('can get', function(t) {
  var streams = AttachedStream();
  var serverPeer = ServerPeer(streams.server, db);

  var requestId = 1;
  streams.client.write(JSON.stringify(['get', requestId ++, prefix + 'A']) + '\n');
  streams.client.write(JSON.stringify(['get', requestId ++, prefix + 'B']) + '\n');

  var replies = [];
  streams.client.on('data', function(d) {
    replies.push(d);
    t.ok(replies.length <= 2);
    if (replies.length == 2) done()
  });

  function done() {
    replies.sort();
    var expectedReplies = [
      JSON.stringify(['got', 1, 'v1']) + '\n',
      JSON.stringify(['got', 2, 'v2']) + '\n'
    ];
    t.deepEqual(replies, expectedReplies);
    t.end();
  }

});

test('can create a read stream', function(t) {
  var streams = AttachedStream();
  var serverPeer = ServerPeer(streams.server, db);

  var requestId = 1;
  var streamOptions = {
    start: prefix + 'A',
    end: prefix + 'B'
  };
  streams.client.write(JSON.stringify(['read', requestId ++, streamOptions]) + '\n');

  var replies = [];
  streams.client.on('data', function(d) {
    replies.push(d);
    t.ok(replies.length <= 3);
    if (replies.length == 3) done()
  });

  function done() {
    var expectedReplies = [
      JSON.stringify(['data', 1, {key: prefix + 'A', value: 'v1'}]) + '\n',
      JSON.stringify(['data', 1, {key: prefix + 'B', value: 'v2'}]) + '\n',
      JSON.stringify(['end', 1]) + '\n',
    ];
    t.deepEqual(replies, expectedReplies);
    t.end();
  }

});

test('can create a write stream', function(t) {
  var streams = AttachedStream();
  var serverPeer = ServerPeer(streams.server, db);

  streams.client.write(JSON.stringify(['writeStream', 1]) + '\n');
  streams.client.write(JSON.stringify(['write', 1, {key: prefix + 'C', value: 'v3'}]) + '\n');

  setTimeout(function() {
    streams.client.write(JSON.stringify(['write', 1, {key: prefix + 'D', value: 'v4'}]) + '\n');
    streams.client.write(JSON.stringify(['end', 1]) + '\n');
  }, 100);

  var replies = [];
  streams.client.on('data', function(d) {
    replies.push(d);
    t.ok(replies.length <= 3);
    if (replies.length == 3) done()
  });


  function done() {
    var expectedReplies = [
      JSON.stringify(['ack', 1]) + '\n',
      JSON.stringify(['ack', 1]) + '\n',
      JSON.stringify(['close', 1]) + '\n',
    ];
    t.deepEqual(replies, expectedReplies);
    t.end();
  }

});

test('closes node', function(t) {
  node.close(t.end.bind(t));
});

function xtest() {}