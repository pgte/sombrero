var net = require('net');
var rimraf = require('rimraf');
var crdt = require('crdt');

/// removeAllDBs

exports.removeAllDBs = removeAllDBs;

function removeAllDBs() {
  var path = __dirname + '/../.sombrero';
  rimraf.sync(path);
}


/// getGossip

exports.getGossip = getGossip;

function getGossip(port, cb) {
  var socket = net.connect(port);
  var doc = crdt.Doc();
  var docStream = doc.createStream({tail: false});
  docStream.once('sync', onSync);
  socket.pipe(docStream).pipe(socket);

  function onSync() {
    docStream.end();
    cb(doc);
  }
}


/// syncGossip

exports.syncGossip = syncGossip;

function syncGossip(port, doc, cb) {
  var socket = net.connect(port);
  var docStream = doc.createStream({tail: false});
  docStream.once('sync', onSync)
  socket.pipe(docStream).pipe(socket);

  function onSync() {
    docStream.end();
    cb(doc);
  }

}