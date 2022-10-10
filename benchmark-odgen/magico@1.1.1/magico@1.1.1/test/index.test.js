var expect = require('chai').expect;

var magico = require('../');

describe('magico', function() {
  var obj;

  beforeEach(function() {
    obj = { a: 1, b: 2, c: { d: { e: ['first', 'second'] } }, d: null };
  });

  describe('magico(obj)', function() {
    it('should return an instance of magico', function() {
      expect(magico(obj)).to.be.an.instanceof(magico);
    });
  });

  describe('.wrap(obj)', function() {
    it('should return an instance of magico', function() {
      expect(magico.wrap(obj)).to.be.an.instanceof(magico);
    });
  });

  describe('.get(obj, path)', function() {
    it('should return the correct value with a valid string path', function() {
      expect(magico.get(obj, 'a')).to.equal(1);
      expect(magico.get(obj, 'b')).to.equal(2);
      expect(magico.get(obj, 'd')).to.be.null;
      expect(magico.get(obj, 'c.d')).to.deep.eq({ e: ['first', 'second'] });
      expect(magico.get(obj, 'c.d.e')).to.deep.eq(['first', 'second']);
      expect(magico.get(obj, 'c.d["e"]')).to.deep.eq(['first', 'second']);
      expect(magico.get(obj, 'c.d["e"][0]')).to.deep.eq('first');
    });

    it('should return undefined with an invalid string path', function() {
      expect(magico.get(obj, 'a.nonExists')).to.be.undefined;
      expect(magico.get(obj, 'a.d.e.f')).to.be.undefined;
    });

    it('should return the correct value with a valid array path', function() {
      expect(magico.get(obj, ['a'])).to.equal(1);
      expect(magico.get(obj, ['b'])).to.equal(2);
      expect(magico.get(obj, ['d'])).to.be.null;
      expect(magico.get(obj, ['c', 'd'])).to.deep.eq({ e: ['first', 'second'] });
      expect(magico.get(obj, ['c', 'd', 'e'])).to.deep.eq(['first', 'second']);
      expect(magico.get(obj, ['c', 'd', 'e', 0])).to.deep.eq('first');
    });

    it('should return undefined with an invalid array path', function() {
      expect(magico.get(obj, ['a', 'nonExists'])).to.be.undefined;
      expect(magico.get(obj, ['a', 'd', 'e', 'f'])).to.be.undefined;
    });
  });

  describe('.exists(obj, path)', function() {
    it('should return true with a valid string path', function() {
      expect(magico.exists(obj, 'a')).to.be.true;
      expect(magico.exists(obj, 'b')).to.be.true;
      expect(magico.exists(obj, 'd')).to.be.true;
      expect(magico.exists(obj, 'c.d')).to.be.true;
      expect(magico.exists(obj, 'c.d.e')).to.be.true;
      expect(magico.exists(obj, 'c.d["e"]')).to.be.true;
      expect(magico.exists(obj, 'c.d["e"][0]')).to.be.true;
    });

    it('should return false with an invalid string path', function() {
      expect(magico.exists(obj, 'a.nonExists')).to.be.false;
      expect(magico.exists(obj, 'a.d.e.f')).to.be.false;
    });

    it('should return true with a valid array path', function() {
      expect(magico.exists(obj, ['a'])).to.be.true;
      expect(magico.exists(obj, ['b'])).to.be.true;
      expect(magico.exists(obj, ['d'])).to.be.true;
      expect(magico.exists(obj, ['c', 'd'])).to.be.true;
      expect(magico.exists(obj, ['c', 'd', 'e'])).to.be.true;
      expect(magico.exists(obj, ['c', 'd', 'e', 0])).to.be.true;
    });

    it('should return false with an invalid array path', function() {
      expect(magico.exists(obj, ['a', 'nonExists'])).to.be.false;
      expect(magico.exists(obj, ['a', 'd', 'e', 'f'])).to.be.false;
      expect(magico.exists(obj, ['c', 'd', 'e', 2])).to.be.false;
    });
  });

  describe('.set(obj, path, value)', function() {
    it('should set the correct value for a valid string path and return true', function() {
      var result1 = magico.set(obj, 'xyz', 'abc');
      expect(result1).to.be.true;
      expect(obj).to.have.property('xyz', 'abc');

      var result2 = magico.set(obj, 'opq.rst', 'abc');
      expect(result2).to.be.true;
      expect(obj).to.have.deep.property('opq.rst', 'abc');
    });

    it('should not set value for a valid string path of `null` or `NaN` value', function() {
      var result = magico.set(obj, 'd.f', 'null value');
      expect(result).to.be.false;
      expect(obj).have.property('d', null);
    });

    it('should set the correct value for a valid array path and return true', function() {
      var result1 = magico.set(obj, ['xyz'], 'abc');
      expect(result1).to.be.true;
      expect(obj).to.have.property('xyz', 'abc');

      var result2 = magico.set(obj, ['opq', 'rst'], 'abc');
      expect(result2).to.be.true;
      expect(obj).to.have.deep.property('opq.rst', 'abc');
    });

    it('should not set value for a valid array path of `null` or `NaN` value', function() {
      var result = magico.set(obj, ['d', 'f'], 'null value');
      expect(result).to.be.false;
      expect(obj).have.property('d', null);
    });
  });

  describe('.remove(obj, path)', function() {
    it('should return true for a valid string path', function() {
      expect(magico.remove(obj, 'a')).to.be.true;
      expect(magico.remove(obj, 'b')).to.be.true;
      expect(magico.remove(obj, 'c.d.e')).to.be.true;
      expect(magico.remove(obj, 'c.d')).to.be.true;

      expect(obj).to.not.have.property('a');
      expect(obj).to.not.have.property('b');
      expect(obj).to.not.have.deep.property('c.d.e');
      expect(obj).to.not.have.deep.property('c.d');
    });

    it('should return false for an invalid string path', function() {
      expect(magico.remove(obj, 'a.b')).to.be.false;
      expect(magico.remove(obj, 'b.c')).to.be.false;
      expect(magico.remove(obj, 'c.d.e.f')).to.be.false;
      expect(magico.remove(obj, 'c.d.z')).to.be.false;
    });

    it('should return true for a valid array path', function() {
      expect(magico.remove(obj, ['a'])).to.be.true;
      expect(magico.remove(obj, ['b'])).to.be.true;
      expect(magico.remove(obj, ['c', 'd', 'e'])).to.be.true;
      expect(magico.remove(obj, ['c', 'd'])).to.be.true;

      expect(obj).to.not.have.property('a');
      expect(obj).to.not.have.property('b');
      expect(obj).to.not.have.deep.property('c.d.e');
      expect(obj).to.not.have.deep.property('c.d');
    });

    it('should return false for an invalid array path', function() {
      expect(magico.remove(obj, ['a', 'b'])).to.be.false;
      expect(magico.remove(obj, ['b', 'c'])).to.be.false;
      expect(magico.remove(obj, ['c', 'd', 'e', 'f'])).to.be.false;
      expect(magico.remove(obj, ['c', 'd', 'z'])).to.be.false;
    });
  });
});

describe('magico.prototype', function() {
  var obj;
  var inst;
  beforeEach(function() {
    obj = { a: 1, b: 2, c: { d: { e: ['first', 'second'] } }, d: null };
    inst = magico(obj);
  });

  describe('.get(obj, path)', function() {
    it('should return the correct value with a valid string path', function() {
      expect(inst.get('a')).to.equal(1);
      expect(inst.get('b')).to.equal(2);
      expect(inst.get('d')).to.be.null;
      expect(inst.get('c.d')).to.deep.eq({ e: ['first', 'second'] });
      expect(inst.get('c.d.e')).to.deep.eq(['first', 'second']);
      expect(inst.get('c.d["e"]')).to.deep.eq(['first', 'second']);
      expect(inst.get('c.d["e"][0]')).to.deep.eq('first');
    });

    it('should return undefined with an invalid string path', function() {
      expect(inst.get('a.nonExists')).to.be.undefined;
      expect(inst.get('a.d.e.f')).to.be.undefined;
    });

    it('should return the correct value with a valid array path', function() {
      expect(inst.get(['a'])).to.equal(1);
      expect(inst.get(['b'])).to.equal(2);
      expect(inst.get(['d'])).to.be.null;
      expect(inst.get(['c', 'd'])).to.deep.eq({ e: ['first', 'second'] });
      expect(inst.get(['c', 'd', 'e'])).to.deep.eq(['first', 'second']);
      expect(inst.get(['c', 'd', 'e', 0])).to.deep.eq('first');
    });

    it('should return undefined with an invalid array path', function() {
      expect(inst.get(['a', 'nonExists'])).to.be.undefined;
      expect(inst.get(['a', 'd', 'e', 'f'])).to.be.undefined;
    });
  });

  describe('.exists(obj, path)', function() {
    it('should return true with a valid string path', function() {
      expect(inst.exists('a')).to.be.true;
      expect(inst.exists('b')).to.be.true;
      expect(inst.exists('d')).to.be.true;
      expect(inst.exists('c.d')).to.be.true;
      expect(inst.exists('c.d.e')).to.be.true;
      expect(inst.exists('c.d["e"]')).to.be.true;
      expect(inst.exists('c.d["e"][0]')).to.be.true;
    });

    it('should return false with an invalid string path', function() {
      expect(inst.exists('a.nonExists')).to.be.false;
      expect(inst.exists('a.d.e.f')).to.be.false;
    });

    it('should return true with a valid array path', function() {
      expect(inst.exists(['a'])).to.be.true;
      expect(inst.exists(['b'])).to.be.true;
      expect(inst.exists(['d'])).to.be.true;
      expect(inst.exists(['c', 'd'])).to.be.true;
      expect(inst.exists(['c', 'd', 'e'])).to.be.true;
      expect(inst.exists(['c', 'd', 'e', 0])).to.be.true;
    });

    it('should return false with an invalid array path', function() {
      expect(inst.exists(['a', 'nonExists'])).to.be.false;
      expect(inst.exists(['a', 'd', 'e', 'f'])).to.be.false;
      expect(inst.exists(['c', 'd', 'e', 2])).to.be.false;
    });
  });

  describe('.set(obj, path, value)', function() {
    it('should set the correct value for a valid string path and return true', function() {
      var result1 = inst.set('xyz', 'abc');
      expect(result1).to.be.true;
      expect(obj).to.have.property('xyz', 'abc');

      var result2 = inst.set('opq.rst', 'abc');
      expect(result2).to.be.true;
      expect(obj).to.have.deep.property('opq.rst', 'abc');
    });

    it('should not set value for a valid string path of `null` or `NaN` value', function() {
      var result = inst.set('d.f', 'null value');
      expect(result).to.be.false;
      expect(obj).have.property('d', null);
    });

    it('should set the correct value for a valid array path and return true', function() {
      var result1 = inst.set(['xyz'], 'abc');
      expect(result1).to.be.true;
      expect(obj).to.have.property('xyz', 'abc');

      var result2 = inst.set(['opq', 'rst'], 'abc');
      expect(result2).to.be.true;
      expect(obj).to.have.deep.property('opq.rst', 'abc');
    });

    it('should not set value for a valid array path of `null` or `NaN` value', function() {
      var result = inst.set(['d', 'f'], 'null value');
      expect(result).to.be.false;
      expect(obj).have.property('d', null);
    });
  });

  describe('.remove(obj, path)', function() {
    it('should return true for a valid string path', function() {
      expect(inst.remove('a')).to.be.true;
      expect(inst.remove('b')).to.be.true;
      expect(inst.remove('c.d.e')).to.be.true;
      expect(inst.remove('c.d')).to.be.true;

      expect(obj).to.not.have.property('a');
      expect(obj).to.not.have.property('b');
      expect(obj).to.not.have.deep.property('c.d.e');
      expect(obj).to.not.have.deep.property('c.d');
    });

    it('should return false for an invalid string path', function() {
      expect(inst.remove('a.b')).to.be.false;
      expect(inst.remove('b.c')).to.be.false;
      expect(inst.remove('c.d.e.f')).to.be.false;
      expect(inst.remove('c.d.z')).to.be.false;
    });

    it('should return true for a valid array path', function() {
      expect(inst.remove(['a'])).to.be.true;
      expect(inst.remove(['b'])).to.be.true;
      expect(inst.remove(['c', 'd', 'e'])).to.be.true;
      expect(inst.remove(['c', 'd'])).to.be.true;

      expect(obj).to.not.have.property('a');
      expect(obj).to.not.have.property('b');
      expect(obj).to.not.have.deep.property('c.d.e');
      expect(obj).to.not.have.deep.property('c.d');
    });

    it('should return false for an invalid array path', function() {
      expect(inst.remove(['a', 'b'])).to.be.false;
      expect(inst.remove(['b', 'c'])).to.be.false;
      expect(inst.remove(['c', 'd', 'e', 'f'])).to.be.false;
      expect(inst.remove(['c', 'd', 'z'])).to.be.false;
    });
  });
});
