var PassThrough = require('stream').PassThrough;
var duplexer = require('duplexer');

module.exports =
function createAttachedStream() {
  var w = new PassThrough({
    decodeStrings: false,
    encoding: 'utf8'
  });
  var r = new PassThrough({
    decodeStrings: false,
    encoding: 'utf8'
  });
  var serverStream = duplexer(w, r);
  var clientStream = duplexer(r, w);

  return {
    client: clientStream,
    server: serverStream
  };
}

