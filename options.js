var extend = require('util')._extend;
var assert = require('assert');

var defaultOptions = {
  base:                        process.cwd() + '/.sombrero',
  isolated:                    false,
  gossip:                      9271,
  broker:                      9272,
  gossip_disseminate_interval: 1000,
  gossip_timeout:              10000,
  ephemeral_port_begin:        32768,
  ephemeral_port_end:          61000,
  join_cluster:                true
};

module.exports =
function Options(options) {
  assert(options, 'Need options');
  if (typeof options != 'object') options = { cluster: options};

  defOptions = extend({}, defaultOptions);
  options = extend(defOptions, options);

  if (! options.cluster) throw new Error('need cluster option');

  return options;
}