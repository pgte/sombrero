var net = require('net');
var test = require('tap').test;
var DuplexEmitter = require('duplex-emitter');
var uuid = require('node-uuid').v4;
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

test('gets a db', function(t) {
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

test('closes node', function(t) {
  node.close(t.end.bind(t));
});