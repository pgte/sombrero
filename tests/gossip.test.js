var test = require('tap').test;
var utils = require('./utils');
var Sombrero = require('../');

var node;
var nodeInfo;
var otherNode;

test('creates node', function(t) {
  utils.removeAllDBs();

  node = Sombrero.Node({
    cluster: 'mycluster'
  });

  nodeInfo = {
    id: node.id,
    host: node.host,
    gossip: node._options.gossip,
    broker: node._options.broker,
    type: 'node'
  };

  node.once('initialized', t.end.bind(t));
});

test('syncs gossip from server', function(t) {
  var port = node._options.gossip;

  utils.getGossip(port, function(doc) {
    var nodes = doc.createSet('type', 'node');

    var expectedNodes = [ { state: nodeInfo } ];

    t.similar(nodes.asArray(), expectedNodes);
    t.end();
  });
});

test('can change gossip', function(t) {
  var port = node._options.gossip;

  otherNode = {
    id:   'SOME-ID',
    host: 'SOMEHOST',
    type: 'node'
  };

  var nodes;

  utils.getGossip(port, function(doc) {
    doc.add(otherNode);
    nodes = doc.createSet('type', 'node');
    utils.syncGossip(port, doc, onSynced);
  });

  function onSynced(doc) {
    var expectedNodes = [ { state: nodeInfo}, { state: otherNode}  ];
    t.similar(nodes.asArray(), expectedNodes);
    t.end();
  }
});

test('closes node', function(t) {
  node.close(t.end.bind(t));
});

test('creates node again', function(t) {
  node = Sombrero.Node({
    cluster: 'mycluster'
  });

  node.once('initialized', t.end.bind(t));
});

test('gossip is still there', function(t) {
  var port = node._options.gossip;
  utils.getGossip(port, function(doc) {
    nodes = doc.createSet('type', 'node');
    var expectedNodes = [ { state: nodeInfo }, { state: otherNode } ];

    t.similar(nodes.asArray(), expectedNodes);
    t.end();
  });
});

test('closes node', function(t) {
  node.close(t.end.bind(t));
});

function xtest() {}