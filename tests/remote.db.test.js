var net = require('net');
var test = require('tap').test;
var DuplexEmitter = require('duplex-emitter');
var uuid = require('node-uuid').v4;
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var async = require('async');
var utils = require('./utils');
var Sombrero = require('../');

var node;
var nodes = [];
var dirs = [__dirname + '/.sombrero/1', __dirname + '/.sombrero/2'];

utils.removeAllDBs();
dirs.forEach(rimraf.sync);
dirs.forEach(function(d) {
  mkdirp.sync(d, 0777);
});

test('creates node', function(t) {

  node = Sombrero.Node({
    cluster: 'mycluster',
    join_cluster: false,
    gossip_disseminate_interval: 100,
    base: dirs[0]
  });

  console.log('node 1 id:', node.id);

  nodes.push(node);

  node.once('initialized', t.end.bind(t));
});

test('creates another node', function(t) {
  utils.removeAllDBs();

  var node = Sombrero.Node({
    cluster: 'mycluster',
    gossip: 9273,
    broker: 9274,
    gossip_disseminate_interval: 100,
    base: dirs[1]
  });

  console.log('node 2 id:', node.id);

  nodes.push(node);

  node.once('initialized', t.end.bind(t));
});

test('introduces both nodes to each other', function(t) {
  nodes[0].gossip.meet(nodes[1].advertising(), function() {
    setTimeout(t.end.bind(t), 1000);
  });
});

test('gets a remote db', function(t) {
  db = node.db('mydb');
  db.put('key1', 'value1', onPut);

  function onPut(err) {
    if (err) throw err;
    db.get('key1', onGet);
  }

  function onGet(err, value) {
    if (err) throw err;
    t.equal(value, 'value1');
    t.end();
  }
});

test('closes nodes', function(t) {
  async.each(nodes, close, t.end.bind(t));

  function close(node, cb) {
    node.close(cb);
  }
});