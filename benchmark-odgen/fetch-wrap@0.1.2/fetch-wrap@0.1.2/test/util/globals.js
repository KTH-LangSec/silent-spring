global.when = function() {
  var args = Array.prototype.slice.apply(arguments);
  args[0] = 'when ' + args[0];
  describe.apply(this, args);
};
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
global.expect = chai.expect;
