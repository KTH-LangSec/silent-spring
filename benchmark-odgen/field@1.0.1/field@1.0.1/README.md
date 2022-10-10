field
=====

Easily get, set, stub values of a field in a JavaScript object.


Why?
----

I got tired of doing this:

```js
var port = cfg && cfg.env && cfg.env.prod && cfg.env.prod.port
```

now...

```js
var field = require('field')
var port = field.get(cfg, 'env.prod.port')
```

or if you prefer ":"...

```js
var field = require('field')
var port = field.get(config, 'env:prod:port')
```

I also got tired of writing long stubs:

```js
var stub = {
  window: {
    localStorage: {
      getItem: function () {
        return 'data'
      },
      length: 1
    }
  }
}
```

now...

```js
var field = require('field')
var stub = {}
field(stub, 'window:localStorage.getItem', function () { return 'data' })
field(stub, 'window:localStorage.length', 1)
```


Installation
------------

    npm i --save field


Usage
-----

### get

Gets the property value of the object. Returns `undefined` if it does not exist.

```js
var field = require('field')
var dbPort = field.get(config, 'environment:production:port')
```


### set

Sets the property value of the object. **Returns the old value.** If the field does not exist
then it returns `undefined` and creates the object chain and sets the value.

```js
var field = require('field')
var database = {}

console.log(field.get(database, 'production.port'))
// => undefined

// will return undefined since it never existed before
field.set(database, 'production.port', 27017)
console.log(database.production.port)
// => 27017
```

### Binding

```js
var field = require('field')

var bigObject = {
  host: {
    url: 'http://myserver.com'
  }
  /*
    ... some big object ...
  */
};

bigObject.get = field.get.bind(bigObject)
bigObject.set = field.set.bind(bigObject)

console.log(bigObject.get('host.url'))
// => 'http://myserver.com'
```

License
-------

(MIT License)

Copyright 2015, [JP Richardson](https://github.com/jprichardson)

