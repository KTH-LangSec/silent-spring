'use strict';

const expect = require('chai').expect;
const ObjHelpers = require('../index');

describe('#ObjHelpers - Get', function() {
  it('should return 1', function() {
    const result = ObjHelpers.get({ a: { b: 1 } }, 'a.b');
    expect(result).to.equal(1);
  });

  it('should return undefined', function() {
    const result = ObjHelpers.get({ a: { b: 1 } }, 'a.b.c');
    expect(result).to.equal(undefined);
  });

  it('should return undefined', function() {
    const result = ObjHelpers.get({ a: { b: 1 } }, 'a.c.b');
    expect(result).to.equal(undefined);
  });
});


describe('#ObjHelpers - Set', function() {
  const obj = {a: {b: 1}};

  it('should change existing value', function() {
    ObjHelpers.set(obj, 'a.b', 2);
    expect(obj.a.b).to.equal(2);
  });

  it('should add non existed props', function() {
    const result = ObjHelpers.set({}, 'a.b', 2);;
    expect(result.a.b).to.equal(2);
  });

  it('should add non existed props 2', function() {
    ObjHelpers.set(obj, 'a.c.d', 2);
    expect(obj.a.c.d).to.equal(2);
  });
});

describe('#ObjHelpers - Has', function() {
  const obj = {a: {b: 1}};

  it('should return true', function() {
    const result = ObjHelpers.has(obj, 'a');
    expect(result).to.equal(true);
  });

  it('should return false', function() {
    const result = ObjHelpers.has(obj);
    expect(result).to.equal(false);
  });

  it('should return true', function() {
    const result = ObjHelpers.has(obj, 'a.b');
    expect(result).to.equal(true);
  });
});


describe('#ObjHelpers - Delete', function() {
  const obj = {
    a: {
      a1: {
        a11: 'foo'
      }
    },
    b: {
      b1: 'bar'
    }
  };

  it('should delete nested existing value', function() {
    ObjHelpers.delete(obj, 'a.a1.a11');
    expect(obj.a.a1.a11).to.equal(undefined);
  });

  it('should not delete non-existing value', function() {
    const res = ObjHelpers.delete(obj, 'a.a1.a11.a111');
    expect(res).to.equal(undefined);
  });

  it('should delete existing value', function() {
    ObjHelpers.delete(obj, 'a.a1');
    expect(obj.a.a1).to.equal(undefined);
  });


});
