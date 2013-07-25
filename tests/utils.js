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

  socket.once('connect', onConnect);
  socket.pipe(doc.createStream()).pipe(socket);

  function onConnect() {
    setTimeout(function() {
      socket.end();
      cb(doc);
    }, 1000);
  }
}


/// syncGossip

exports.syncGossip = syncGossip;

function syncGossip(port, doc, cb) {
  var socket = net.connect(port);

  socket.once('connect', onConnect);
  socket.pipe(doc.createStream()).pipe(socket);

  function onConnect() {
    setTimeout(function() {
      socket.end();
      cb(doc);
    }, 1000);
  }

}