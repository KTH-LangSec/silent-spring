'use strict';

const assert = require('assert');
const cache = require('../lib/index.js').create({
    file: __dirname + '/ga-api-cache.json'
});

cache.clear();
assert.equal(cache.size(), 0);

cache.set('key', 1, {
    life: 3
});

assert.equal(cache.size(), 1);

assert.equal(cache.get('key'), 1);
setTimeout(() => assert.equal(cache.get('key'), null), 5000);