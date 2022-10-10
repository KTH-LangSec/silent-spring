# Config module #

Simple cache module. Uses `lowdb` as file storage wrapper.


## Installation

In your project folder run:
>` npm install node-file-cache --save`

Note: The module code uses few ES6 features, so at least 4.4.5 version of Node is required.


## Usage

First you need to include the module and optionally configure it.
>` const cache = require('node-file-cache').create(/*{ options }*/);`

Requiring the module returns a `create` factory function that returns cache module instance.

Cache storage can be cofigured using these directives:
* `file` - file name or path to file where records are stored (if missing, file will be created automatically)
* `life` - global record lifespan in seconds, defaults to 3600 (one hour)

Using the cache module is quite straightforward:
>` cache.set(key, value);   // creates a new cache record`

>` cache.get(key);          // retrieves a record from cache`

>` cache.size();            // number of records in cache`

>` cache.expire(<expression>);  // exipres (removes) cached records (see example)`

>` cache.clear();           // removes all records from cache`

By default, all cache records have lifespan of one hour. This can be either changed globally using configuration directive when creating the cache instance (see above), or it can be set for particular records.
Note: If you change the global lifespan setting, it will affect only newly added records.

>` cache.set(key, item, options);`

Let's look at `options` object for cache record.
* `life` - lifespan in seconds
* `tags` - array of tags, that can be used to expire (remove) cached records


## Example

Adding stuff to cache and getting it back.
```
const cache = require('node-file-cache').create();  // default configuration

const key = 'my-cache-key';
const item = {
    name: 'my cache item'
};
const options = {
    life: 60,   // set lifespan of one minute
    tags: [ 'my-cache-tag', 'another-tag' ]
};

cache.set(key, item, options);

const cachedItem = cache.get(key); // depending on context this can either return cached data or null, if record is missing or expired 
```

Removing stuff from cache. Arguments for `expire` method are defined in previous example.
```
// by cache key
cache.expire(key);  // removes item with particular key

// by chache tags
cache.expire(tags);

// by callback
cache.expire((record) => {
    // hook your logic here
    return true; // if record should be removed
});
```

## Issues

Since the github repository is not ready yet, please use my email address in profile to contact me. Cheers!