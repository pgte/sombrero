var test = require('tap').test;
var PassThrough = require('stream').PassThrough;
var PeerEmitter = require('../peer_emitter');

test('emits events', function(t) {
  var s = new PassThrough();

  var emitter = PeerEmitter(s);

  emitter.on('ev1', function(a, b, c) {
    t.strictEqual(a, 'A');
    t.strictEqual(b, 'B');
    t.type(c, 'undefined');
    t.end();
  });

  s.write('["ev1", "A", "B"]\n');
});

test('wrong JSON yields an error', function(t) {
  var s = new PassThrough();

  var emitter = PeerEmitter(s);
  emitter.on('error', function(err) {
    t.ok(err.message.match(/Error parsing peer data: Unexpected token/));
    t.end();
  });

  s.write("{abc:1}\n");
});


test('streaming things other than an array yields an error', function(t) {
  var s = new PassThrough();

  var emitter = PeerEmitter(s);
  emitter.on('error', function(err) {
    t.ok(err.message.match(/data should be array/));
    t.end();
  });

  s.write('{"abc": 1}\n');
});

function xtest() {};