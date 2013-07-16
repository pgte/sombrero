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

You can help a node discover other cluster nodes by pointing it to a URL that contains an array of hosts and ports:

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
  }
]
```

## Database

You can get a reference to a database using:

```javascript
var db = node.db('mydatabase');
```

You can also pass it some options:

```javascript
var options = {
  w: 3,
  r: 1
};

var db = node.db('mydatabase', options);
```

Valid options are:

* `r`: read quorum (default is 2)
* `w`: write quorum (default is 2)
* `n`: replication factor (default is 3)

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

Type can be any of the following:

* `put`
* `del`
* `batch`

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

The same API of [levelup](https://npmjs.org/package/levelup#createReadStream).

### createReadStream([options])

```javascript
var s = db.createReadStream();

s.on('data', function(data) {
  console.log('%j = %j', data.key, data.value);
});

s.on('error', function(err) {
  console.error(err);
});

s.on('end', function() {
  console.log('stream ended');
});

s.on('close', function() {
  console.log('stream closed');
});
```

Additionally, you can supply an options object as the first parameter to createReadStream() with the following options:

* `start`: the key you wish to start the read at. By default it will start at the beginning of the store. Note that the start doesn't have to be an actual key that exists, LevelDB will simply find the next key, greater than the key you provide.
* `end`: the key you wish to end the read on. By default it will continue until the end of the store. Again, the end doesn't have to be an actual key as an (inclusive) <=-type operation is performed to detect the end. You can also use the destroy() method instead of supplying an 'end' parameter to achieve the same effect.
* `reverse` (boolean, default: false): a boolean, set to true if you want the stream to go in reverse order. Beware that due to the way LevelDB works, a reverse seek will be slower than a forward seek.
* `keys` (boolean, default: true): whether the 'data' event should contain keys. If set to true and 'values' set to false then 'data' events will simply be keys, rather than objects with a 'key' property. Used internally by the createKeyStream() method.
* `values` (boolean, default: true): whether the 'data' event should contain values. If set to true and 'keys' set to false then 'data' events will simply be values, rather than objects with a 'value' property. Used internally by the createValueStream() method.
*  `limit` (number, default: -1): limit the number of results collected by this stream. This number represents a maximum number of results and may not be reached if you get to the end of the store or your 'end' value first. A value of -1 means there is no limit.


### createKeyStream([options])

A KeyStream is a ReadStream where the 'data' events are simply the keys from the database so it can be used like a traditional stream rather than an object stream.

You can obtain a KeyStream either by calling the createKeyStream() method on a db object or by passing passing an options object to createReadStream() with keys set to true and values set to false.

```javascript
var s = db.createKeyStream();

s.on('data', function(key) {
  console.log('key=%j', key);
});
```

### createValueStream([options])

A ValueStream is a ReadStream where the 'data' events are simply the values from the database so it can be used like a traditional stream rather than an object stream.

You can obtain a ValueStream either by calling the createValueStream() method on a db object or by passing passing an options object to createReadStream() with values set to true and keys set to false.

```javascript
var s = db.createValueStream()

s.on('data', function (data) {
  console.log('value=%j', data)
});
```

### createWriteStream([options])

A WriteStream can be obtained by calling the createWriteStream() method. The resulting stream is a complete Node.js-style Writable Stream which accepts objects with 'key' and 'value' pairs on its write() method.

The WriteStream will buffer writes and submit them as a batch() operations where writes occur within the same tick.

```javascript
var s = db.createWriteStream();

s.on('error', function(err) {
  console.error(err);
});

s.on('close', function() {
  console.log('stream closed');
});

s.write({key: 'name', value: 'Sombrero'});
s.end();
```

#### delete

If individual write() operations are performed with a 'type' property of 'del', they will be passed on as 'del' operations to the batch.

```javascript
s.write({ type: 'del', key: 'name' });
```

If the WriteStream is created a 'type' option of 'del', all write() operations will be interpreted as 'del', unless explicitly specified as 'put'.

```javascript
var s = db.createWriteStream({ type: 'del' })

s.on('error', function (err) {
  console.log('Oh my!', err)
})
s.on('close', function () {
  console.log('Stream closed')
})

s.write({ key: 'name' })
s.write({ key: 'dob' })
// but it can be overridden
s.write({ type: 'put', key: 'spouse', value: 'Ri Sol-ju' })
s.write({ key: 'occupation' })
s.end()
```


### Follow Stream

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

db.put('name', 'Sobrero', writeOptions, function(err) {
  // ...
});
```

## R - Read Quorum

R represents the number of nodes that must return results before a read is considered successful. By default this value is `2`;

You can set `w` at the db level:

```javascript
var options = {
  r: 3
};

var db = node.db('mydatabase', options);
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

