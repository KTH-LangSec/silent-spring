var expect = require('chai').expect;
var blindfold = require('../index');

describe('@module blindfold', function() {

  var test = {
    over: { the: { hill: true } },
    and: ['through', 'the', 'woods']
  };

  it('should return the value at the given path', function() {
    expect(blindfold(test, 'over.the.hill')).to.equal(true);
  });

  it('should return undefined for a non-existent path', function() {
    expect(blindfold(test, 'and.through.the.woods')).to.equal(undefined);
  });

  it('should return the value at the array index', function() {
    expect(blindfold(test, 'and.2')).to.equal('woods');
  });

  it('should set the value at the given path', function() {
    blindfold(test, 'over.the.hill', 'grandmother\'s house');
    expect(test.over.the.hill).to.equal('grandmother\'s house');
  });

});
