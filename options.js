var extend = require('util')._extend;
var assert = require('assert');

var defaultOptions = {
  base: process.cwd() + '/.sombrero'
};

module.exports =
function Options(options) {
  assert(options, 'Need options');
  if (typeof options != 'object') options = { cluster: options};

  defOptions = extend({}, defaultOptions);
  options = extend(defOptions, options);

  assert(options.cluster, 'No cluster name defined');

  return options;
}