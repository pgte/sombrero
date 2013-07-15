var test = require('tap').test;

var Sombrero = require('../');

test('no options fails', function(t) {
  t.throws(function() {
    var node = Sombrero.Node();
  });
  t.end();
});

test('options need cluster', function(t) {
  t.throws(function() {
    var node = Sombrero.Node({});
  });
  t.end();
});

test('with cluster it doesnt fail', function(t) {
  var node = Sombrero.Node('testcluster');
  t.equal(node.cluster.name, 'testcluster');
  t.end();
});