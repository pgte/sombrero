# Sombrero

> Dynamo-like Data Storage System for Node.js Using LevelDB.

## Install

```bash
$ npm install sombrero --save
```

## Require

```javascript
var clusterName = 'mycluster';
var Sombrero = require('sombrero');
```

## Create Node

```javascript
var clusterName = 'mycluster'
var node = Sombrero.Node(clusterName);
```

## Configure

By default sombrero puts all the LevelDB files inside the `.sombrero` directory inside the current working directory, but you can change that:

```javascript
var options = {
  cluster: 'mycluster',
  base: '/path/to/my/sombrero/dir'
};

var node = Sombrero(options);
```

## Discover Cluster

By default Sombrero uses Bonjour on the local network to find other nodes.

You help a node discover other cluster nodes by pointing it to a URL that contains an array of

```javascript
node.cluster.discoverOthersUsing('http://registry.acme.com/cluster/hosts.json');
```

The cluster.json file should be something like this:

```javascript
[
  {
    "host": "one.node.acme.com",
    "port": 8283
  },
  {
    "host": "two.node.acme.com",
    "port": 9183
  },
]
```

## Database

You can get a reference to a database using:

```javascript
var db = node.db('mydatabase');
```

If you get the same database repeatedly you get a reference to the same object:

```javascript
var db2 = node.db('mydatabase');
assert.deepEqual(db, db2);
```

## Listen for changes

```javascript
var liveStream = db.liveStream();

liveStream.on('readable', function() {
  var change;
  while(change = liveStream.read()) {
    console.log('key %j of type %j has value %j',
                change.key, change.type, change.value);
  }
});
```

## Write a key to it

```javascript
db.put('name', 'Sombrero', function(err) {
  if (err) throw err;
  console.log('wrote sombrero');
});
```

## Read a key from it

```javascript
db.get('name', function(err, value) {
  if (err) throw err;
  console.log('Name is %s', value);
});
```

## Streams

PENDING


## Dynamo-like tweaks

### Resolving conflicts

When a network partition occurs or you have concurrent writes to the same key you will get conflicts. By default Sombrero resolves conflicts by selecting the latest update ("last write wins" - LWW).

You can override this method by implementing `db.resolve`:

```javascript
db.resolve = function(values, cb) {
  // here we resolve by using the first value,
  // but you could be more fancy than that
  cb(values[0]);
};
```

## Data Partitioning

Although Dynamo databases partition the data based on a distributed hash table algorythm, Sombrero behaves differently.

Each database is stored on N servers. The partitioning of the data is left up to the user. This makes possible to do fast local reads, range queries and for server affinity to work.

### Affinity

When you instantiate a sombrero database, if sombrero finds out that the database is already on the cluster, it uses the database remotely.

But you may force it to be local based on an option:

```javascript
var dbOptions = {
  local: true
};

var db = Sombrero.db('mydatabase', options);
```

In this case the database will emit a `local` event when the entire database is available locally. This may be useful if you want to perform queries only after the data has been made local:

```javascript
db.once('local', function() {
  console.log('now all data is local, now I can query it really fast');
});
```

Before this event all queries are made remotely.


### CAP Controls

Sombrero lets you tune consistency, latency and availability by letting you configure 3 options per database: (N, R and W).

## N

N represents the number of nodes that Sombrero will try to replicate your database to. By default this is 3.

You can change this by setting the `n` db option:

```javascript
var options = {
  n: 4
};

var db = node.db('mydatabase', options);
```

## W — Write Quorum

W represents the number of nodes that must report success before an update is considered complete. Defaults to `2`;

If you only care about the local node when writing, set `w` to 1.

You can set `w` at the db level:

```javascript
var options = {
  w: 3
};

var db = node.db('mydatabase', options);
```

And you can override it on a specific `put` command:

```javascript
var writeOptions = {
  w: 1
};
db.put('name', 'Sobrero', writeOptions);
```

## R - Read Quorum

R represents the number of nodes that must return results before a read is considered successful. By default this value is `2`;

You can set `w` at the db level:

```javascript
var options = {
  r: 3
};

var db = node.db('mydatabase', options, function(err) {
  // ...
});
```

And you can override it on a specific `get` command:

```javascript
var readOptions = {
  r: 3
};

db.get('name', readOptions, function(err, value) {
  // ...
});
```
