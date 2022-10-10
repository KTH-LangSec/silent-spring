var test = require('tape');
var prop = require('./index.js');

test('non-object', function(t) {
  t.plan(3);
  t.equal(prop(false, 'a'), undefined);
  t.equal(prop(false, '/a'), undefined);
  t.equal(prop(false, ['a']), undefined);
});

test('null object', function(t) {
  t.plan(3);
  t.equal(prop(null, 'a'), undefined);
  t.equal(prop(null, '/a'), undefined);
  t.equal(prop(null, ['a']), undefined);
});

test('undefined object', function(t) {
  t.plan(6);
  t.equal(prop(undefined, 'a'), undefined);
  t.equal(prop(undefined, '/a'), undefined);
  t.equal(prop(undefined, ['a']), undefined);
  t.equal(prop(undefined, 'a.b.c'), undefined);
  t.equal(prop(undefined, '/a/b/c'), undefined);
  t.equal(prop(undefined, ['a', 'b', 'c']), undefined);
});

test('empty object', function (t) {  
    t.plan(5);

    t.equal(prop({}, 'a.b'), undefined);
    t.equal(prop({}, '/a/b'), undefined);
    t.equal(prop({}, ['a', 'b']), undefined);

    t.equal(prop({}, ''), undefined);
    t.equal(prop({}, []), undefined);
});

test('set shallow value', function(t) {
  t.plan(1);

  var obj = {};
  
  prop(obj, 'a', true);
  prop(obj, 'b', 1);
  prop(obj, 'c', 'hello');

  t.deepEqual(obj, {
    a: true, 
    b: 1, 
    c: 'hello'
  });
});

test('set deep value', function(t) {
  t.plan(1);

  var obj = {};
  
  prop(obj, 'a.b', true);
  prop(obj, '/c/d', 1);
  prop(obj, ['e', 'f'], 'hello');  

  t.deepEqual(obj, {
    a: {b: true}, 
    c: {d: 1}, 
    e: {f: 'hello'}    
  });
});

test('seting deep value to undefined trims empty objects', function(t) {
  t.plan(2);

  var obj = {a: {b: {c: true}}};
  prop(obj, 'a.b.c', undefined);
  t.deepEqual(obj, {});

  var obj2 = {a: {b: {c: true}}, d: 1};
  prop(obj2, 'a.b.c', undefined);
  t.deepEqual(obj2, {d: 1});
});

test('get prop on null returns undefined', function(t) {
  t.plan(1);

  t.equal(prop(null, 'a'), undefined);
});

test('get shallow value', function(t) {
  t.plan(4);

  var obj = {a: true, b: 1, c: 'hello'};
  
  t.equal(prop(obj, 'a'), true);
  t.equal(prop(obj, '/b'), 1);
  t.equal(prop(obj, ['c']), 'hello');
  t.equal(prop(obj, 'd'), undefined); 
});

test('get deep value', function(t) {
  t.plan(4);

  var obj = {a: {b: true}, c: {d: 1}, e: {f: 'hello'}};
  
  t.equal(prop(obj, 'a.b'), true);
  t.equal(prop(obj, '/c/d'), 1);
  t.equal(prop(obj, ['e', 'f']), 'hello');  
  t.equal(prop(obj, 'g.h'), undefined);
});

test('returns undefined when non object is passed as src', function(t) {
  t.equal(prop(null, 'a'), undefined)
  t.equal(prop(undefined, 'a'), undefined)
  t.end()
});
