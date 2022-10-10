'use strict';

const assert = require('assert');
const cache = require('../lib/index').create();

// cleanup
cache.clear();
assert.equal(cache.size(), 0);

// add record
const item1 = { yo: 'dawg' };
const key1 = 'mittenz';
cache.set(key1, item1);

const result1 = cache.get(key1);
assert.deepEqual(item1, result1);
assert.equal(cache.size(), 1);

// add same record
cache.set(key1, item1);
assert.deepEqual(item1, result1);
assert.equal(cache.size(), 1);

// add next record
const item2 = {
    foo: 'bar'
};
const key2 = 'kittenz'; 
cache.set(key2, item2);

const result2 = cache.get(key2);
assert.deepEqual(item2, result2);
assert.equal(cache.size(), 2);

// add record with tags
const item3 = {
    bar: 'baz'
};
const key3 = 'bat';
const tags3 = ['bat-3'];
cache.set(key3, item3, {
    tags: tags3
});

const result3 = cache.get(key3);
assert.deepEqual(item3, result3);
assert.equal(cache.size(), 3);

// expire by tags
cache.expire(tags3);
assert.equal(cache.size(), 2);

// add record with lifespan
const item4 = {
    bar: 'baziliero'
};
const key4 = 'batbaz';
const span = 1;
cache.set(key4, item4, {
    life: span
});

setTimeout(() => {
    const result4 = cache.get(key4);
    assert.equal(result4, null);
    assert.equal(cache.size(), 2);
}, 3000);


