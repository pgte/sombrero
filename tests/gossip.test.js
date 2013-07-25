var net = require('net');
var test = require('tap').test;
var crdt = require('crdt');
var utils = require('./utils');
var Sombrero = require('../');

var node;

test('creates node', function(t) {
  utils.removeAllDBs();

  node = Sombrero.Node({
    cluster: 'mycluster'
  });

  node.once('initialized', t.end.bind(t));
});

test('syncs gossip from server', function(t) {
  var port = node._options.gossip;

  var socket = net.connect(port);
  var doc = crdt.Doc();
  var nodes = doc.createSet('type', 'node');
  socket.pipe(doc.createStream()).pipe(socket);

  setTimeout(function() {
    var expectedNodes = [{
      state: {
        id: node.id,
        host: node.host,
        port: node._options.broker,
        type: 'node'
      }
    }];

    t.similar(nodes.asArray(), expectedNodes);
    socket.end();
    t.end();
  }, 1000);
});

test('closes node', function(t) {
  node.close(t.end.bind(t));
});