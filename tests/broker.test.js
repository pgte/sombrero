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

test('connects to broker and gets db ref', function(t) {
  var con = net.connect(node.broker.port, node.host);
  var server = DuplexEmitter(con);
  server.on('db', onDB);

  var reqId1 = uuid();
  var reqId2 = uuid();
  var expectedDBs = {};
  expectedDBs[reqId1] = 'mydbname1';
  expectedDBs[reqId2] = 'mydbname2';
  server.emit('db', reqId1, expectedDBs[reqId1]);
  server.emit('db', reqId2, expectedDBs[reqId2]);

  var responses = 0;
  function onDB(reqId, dbName, port, host) {
    if (! expectedDBs.hasOwnProperty(reqId))
      throw new Error('unexpected reply ' + reqId);

    t.equal(dbName, expectedDBs[reqId]);
    t.type(port, 'number');
    t.type(host, 'string');
    if (++ responses == 2) {
      con.destroy();
      t.end();
    }
  }
});

test('closes node', function(t) {
  node.close(t.end.bind(t));
});