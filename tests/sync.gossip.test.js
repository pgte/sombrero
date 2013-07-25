var test    = require('tap').test;
var async   = require('async');
var rimraf  = require('rimraf');
var crdt    = require('crdt');
var utils   = require('./utils');
var horde   = require('./horde');

var Sombrero = require('../');

var nodeCount = 10;
var nodes;
var dir = __dirname + '/.sombrero';

rimraf.sync(dir)

test('creates nodes', function(t) {

  nodes = horde(10, 'synccluster', dir);

  async.each(nodes, waitForInitialized, t.end.bind(t));

  function waitForInitialized(node, cb) {
    node.once('initialized', cb);
  }

});

test('adds half of them to the rest', function(t) {
  for(var i = 0 ; i < nodes.length ; i ++) {
    advertise(nodes[i], nodes[(i + 1) % nodes.length]);
  }

  // nodeB, meet nodeA
  function advertise(nodeA, nodeB) {
    var nodeInfo = nodeA.advertising();
    var doc = crdt.Doc();
    doc.add(nodeInfo);
    utils.syncGossip(nodeB.gossip.port, doc, done);
  }

  var dones = 0;
  function done() {
    dones ++;
    if (dones == nodes.length) t.end();
  }

});

test('waits a bit', function(t) {
  setTimeout(t.end.bind(t), 1000);
});

test('all nodes have correct gossip', function(t) {

  async.each(nodes, hasCorrectGossip, t.end.bind(t));

  function hasCorrectGossip(node, cb) {
    utils.getGossip(node.gossip.port, function(doc) {
      var nodeList = doc.createSet('type', 'node').asArray();
      t.equal(nodeList.length, nodes.length);
      t.deepEqual(nodeList.map(prop('id')).sort(), nodes.map(prop('id')).sort());
      cb();
    });
  }

});


test('closes nodes', function(t) {

  async.each(nodes, close, t.end.bind(t));

  function close(node, cb) {
    node.close(cb);
  }
});

function xtest() {}

function prop(p) {
  return function(o) {
    return o[p];
  };
}