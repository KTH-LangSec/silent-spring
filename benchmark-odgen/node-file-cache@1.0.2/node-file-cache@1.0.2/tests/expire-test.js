'use strict';

const assert = require('assert');
const cache = require('../lib/index').create();

cache.clear();
assert.equal(cache.size(), 0);

const items = [
    {
        key: 'one',
        item: {
            name: 'one'
        },
        options: {}
    },
    {
        key: 'two',
        item: {
            name: 'two'
        },
        options: {
            tags: [ 'two' ]
        }
    },
    {
        key: 'three',
        item: {
            name: 'three'
        },
        options: {
            life: 60
        }
    },
    {
        key: 'four',
        item: {
            name: 'four'
        },
        options: {
            tags: [ 'four' ],
            life: -1
        }
    }
];

items.forEach((item) => {
    cache.set(item.key, item.item, item.options);
});

assert.equal(cache.size(), items.length);

// expire by key
cache.expire('one');
assert.equal(cache.get('one'), null);
assert.equal(cache.size(), items.length - 1);

// expire by tags
cache.expire(['two']);
assert.equal(cache.get('two'), null);
assert.equal(cache.size(), items.length - 2);

// expire by callback
cache.expire((record) => record.key === 'three');
assert.equal(cache.get('three'), null);
assert.equal(cache.size(), items.length - 3);

// expire by lifespan
assert.equal(cache.get('four'), null);
assert.equal(cache.size(), items.length - 4);