var test = require('tap').test;

var Sombrero = require('../');

var node;
var db;

test('starts local db', function(t) {

  try {
    require('fs').unlinkSync(__dirname + '/.sombrero');
  } catch(_) {}

  node = Sombrero.Node({
    cluster: 'mycluster',
    isolated: true
  });

  db = node.db('db1', { local: true });

  db.once('ready', function() {
    t.end();
  });

});

var prefix;

test('can get a write stream', function(t) {
  prefix = Date.now();
  var s = db.createWriteStream();
  s.write({key: prefix + ':k1', value: 'v1'});
  s.write({key: prefix + ':k2', value: 'v2'});
  s.write({key: prefix + ':k3', value: 'v3'});
  s.end();

  // PENDING: s.end(data) shold work
  // check https://github.com/rvagg/node-levelup/issues/159

  s.on('close', onClose);

  var closed = false;

  function onClose() {
    t.notOk(closed);
    closed = true;
    t.end();
  }
});

test('can get a read stream', function(t) {
  var s = db.createReadStream();
  s.on('data', onData);
  s.on('end', onEnd);

  var i = 0;
  function onData(d) {
    var key = d.key;
    var value = d.value;
    if (key.indexOf(prefix) == 0) {
      i ++;

      var expectedKey = prefix + ':k' + i;
      t.equal(key, expectedKey);

      var expectedValue = 'v' + i;
      t.equal(value, expectedValue);
    }
  }

  var ended = false;
  function onEnd() {
    t.notOk(ended);
    ended = true;
    t.equal(i, 3);
    t.end();
  }
});

test('can get a key stream', function(t) {
  var s = db.createKeyStream();
  s.on('data', onData);
  s.on('end', onEnd);

  var i = 0;
  function onData(key) {
    if (key.indexOf(prefix) == 0) {
      i ++;
      t.equal(key, prefix + ':k' + i);
    }
  }

  function onEnd() {
    t.equal(i, 3);
    t.end();
  }
});

test('can get a value stream', function(t) {
  var options = {
    start: prefix + ':k1',
    end: prefix + ':k3'
  }
  var s = db.createValueStream(options);
  s.on('data', onData);
  s.on('end', onEnd);

  var i = 0;
  function onData(value) {
    i ++;
    t.equal(value, 'v' + i);
  }

  function onEnd() {
    t.equal(i, 3);
    t.end();
  }
});

test('can create a writable delete stream', function(t) {
  var s = db.createWriteStream({type: 'del'});
  s.write({key: prefix + ':k1'});
  s.write({key: prefix + ':k2'});
  s.end();

  s.once('close', t.end.bind(t));
});

test('the values got deleted', function(t) {
  var s = db.createReadStream();
  s.on('data', onData);
  s.on('end', onEnd);

  var i = 0;
  function onData(d) {
    var key = d.key;
    var value = d.value;
    if (key.indexOf(prefix) == 0) {
      i ++;
      t.equal(value, 'v3');
    }
  }

  function onEnd() {
    t.equal(i, 1);
    t.end();
  }
});

test('closes node', function(t) {
  node.close(t.end.bind(t));
});