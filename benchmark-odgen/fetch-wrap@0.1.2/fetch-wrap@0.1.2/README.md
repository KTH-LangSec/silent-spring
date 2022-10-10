fetch-wrap
====
[![Build Status](https://secure.travis-ci.org/benjamine/fetch-wrap.svg)](http://travis-ci.org/benjamine/fetch-wrap)
[![Code Climate](https://codeclimate.com/github/benjamine/fetch-wrap/badges/gpa.svg)](https://codeclimate.com/github/benjamine/fetch-wrap)
[![Test Coverage](https://codeclimate.com/github/benjamine/fetch-wrap/badges/coverage.svg)](https://codeclimate.com/github/benjamine/fetch-wrap)
[![NPM version](https://badge.fury.io/js/fetch-wrap.svg)](http://badge.fury.io/js/fetch-wrap)
[![NPM dependencies](https://david-dm.org/benjamine/fetch-wrap.svg)](https://david-dm.org/benjamine/fetch-wrap)

extend [WHATWG fetch API](https://developer.mozilla.org/en/docs/Web/API/Fetch_API) with middleware

- transparent, your extended fetch mantains fetch API `fetch(url, options)`
- recursive, extend fetch, extend extended fetch, ...
- use over any fetch implementation you like ([native fetch](http://caniuse.com/#search=fetch), [fetch-ponyfill](https://www.npmjs.com/package/fetch-ponyfill), [fetch-polyfill](https://www.npmjs.com/package/fetch-polyfill), etc.)
- pick from built-in middleware and/or write yours
- unit tested and benchmarked against plain fetch
- isomorphic

Install
-------
``` sh
npm install fetch-wrap --save
```

Usage
-----

``` js
const fetchWrap = require('fetch-wrap');

// you can use native fetch(), or the implementation you prefer
let fetch = require('fetch-ponyfill')();

// extend fetch with a list of wrappers
fetch = fetchWrap(fetch, [
  function middleware1(url, options, innerFetch) {
    // this middleware does nothing
    return innerFetch(url, options);
  },
  middleware2,
  middleware3,
]);

// use your extended fetch
fetch('http://localhost:8080/file.json').then(result => console.log(result));
```

Built-in Middleware
-------------------

There's some useful middleware in this package that you can optionally import
see [src/middleware.js](src/middleware.js) for details, here's a full example:


``` js
var fetchWrap = require('fetch-wrap');
var middleware = require('fetch-wrap/middleware');
var fetch = fetchWrap(fetch, [
  // support options.params, replace tokens in url and adds query string params
  middleware.urlParams({
    host: 'localhost'
  }),
  // apply options based on url (supports wildcards)
  middleware.optionsByUrlPattern([
    {
      for: 'http://localhost*',
      options: {
        headers: {
          Authorization: 'Token 1234'
        },
        timeouts: {
          // will send log events at 2s and 5s with these levels
          2: 'warn',
          5: 'error' // 5sec timeout from localhost, error!
        }
      }
    }
  ]),
  // automatically serialize body to JSON if needed
  middleware.sendJson(),
  // automatically parse JSON (revives Dates), optionally send Accept header
  //   throws on http errors
  middleware.receiveJson()
  // logs events (start, success, fail, timeouts), defaults to console but supports custom .log handler
  middleware.logger()
]);

fetch('http://{host}:8080/test.json', {
  params: {
    utm_source: 'nodejs'
  }
}).then(result => console.log(result));

```

Write your own Middleware!
-------------------

``` js
const fetchWrap = require('fetchWrap');
fetch = fetchWrap(fetch, [

  function(url, options, fetch) {
    // modify url or options
    return fetch(url.replace(/^(http:)?/, 'https:'), options);
  },

  function(url, options, fetch) {
    // add headers
    return fetch(url, fetchWrap.merge({}, options, {
      headers: {
        Authorization: 'Token 123456'
      }
    });
  }

  function(url, options, fetch) {
    // modify result
    return fetch(url, options).then(function(response) {
      if (!response.ok) {
        throw new Error(result.status + ' ' + result.statusText);
      }
      if (/application\/json/.test(result.headers.get('content-type'))) {
        return response.json();
      }
      return response.text();
    });
  }

  function(url, options, fetch) {
    // catch errors
    return fetch(url, options).catch(function(err) {
      console.error(err);
      throw err;
    });
  }

]);

// use your customized fetch!

fetch('http://somedomain.com/news.json').then(function(news) {
  // GET https://somedomain.com/news.json with Authorization header, and parsed to json
  console.log(news.items);
});
```

Testing
-------

For unit testing, you can use the built-in `testing` middleware to mock or spy fetch calls.

``` js
var fetchWrap = require('fetch-wrap');
var middleware = require('fetch-wrap/middleware');
var spyLog = [];
var fetch = fetchWrap(fetch, [
  middleware.optionsByUrlPattern([
    {
      for: 'http://localhost*',
      options: {
        // mock every request to this url
        mock: { name: 'john' }
      }
    }
  ])
  middleware.testing({
    // optional spy function
    spy(url, options) {
      spyLog.push({ url: url, options: options })
    }
  })
]);

// it will fail if no `options.mock` is found, to prevent real requests during unit-testing
fetch('http://localhost:8080').then(function(result) {
  expect(spyLog[0].url).to.eql('http://localhost:8080');
  expect(result).to.eql({ name: 'john' });
})

```

For details on built-in middleware check [src/middleware.js](src/middleware.js)

Benchmark
---------

``` sh
node src/benchmark
```

compares fetch (fetch-ponyfill, not extended), with extended fetch (fetch-ponyfill extended with some of the built-in middleware).

Typically results show performance cost is neglectable, example:
```
fetch GET json x 435 ops/sec ±1.52% (80 runs sampled)
extended fetch GET json x 438 ops/sec ±1.24% (81 runs sampled)
```
