# Sombrero

> Dynamo-like Data Storage System for Node.js Using LevelDB.

## Install

```bash
$ npm install sombrero --save
```

## Require

```javascript
var Sombrero = require('sombrero');
```

## Configure

By default sombrero puts all the LevelDB files inside the `.sombrero` directory inside the current working directory, but you can change that:

```javascript
Sombrero.base = '/path/to/my/sombrero/dir';
```

## Instantiate

```javascript
var db = Sombrero.db('mydatabase');
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

### Multiple Values

By default a database does not allow multiple values for the same database, but you can configure it to if you need to handle conflict resolution:

```javascript
var dbOptions = {
  multiple: true
};

var db = Sombrero.db('mydatabase', options);
```

Then you will get an array on get operations:

```javascript
db.get('name', function(err, names) {
  console.log('got %d names', names.length);

});
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