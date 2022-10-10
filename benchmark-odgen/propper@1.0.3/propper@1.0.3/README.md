# propper

[![NPM version][npm-img]][npm-url]
[![License][license-img]][license-url]

A tool for getting and setting object properties using dot notation, path notation, and arrays to speficy properties.

## Installation

```
npm install propper
```

## Usage

``` javascript
var prop = require('propper')

var obj = {a: 1, b: {c: 'hello'}};

// getters
console.log(prop(obj, 'b.c'));      // 'hello'
console.log(prop(obj, '/b/c'));     // 'hello'
console.log(prop(obj, ['b', 'c'])); // 'hello'

// setters
console.log(prop(obj, 'b.c', 1));      // 1
console.log(prop(obj, '/b/c', 2));     // 2
console.log(prop(obj, ['b', 'c'], 3)); // 3

// setters can also be used to delete keys from an object by passing in undefined as the value
prop(obj, 'b.c', undefined);
console.log(obj); // {a: 1}

// If the deletion of a key would yield, an empty object, then that object will be removed too.

obj = {a: {b: {c: true}}};
prop(obj, 'a.b.c', undefined);
console.log(obj); // {}
```

[ISC][license-url]

[npm-img]: https://img.shields.io/npm/v/propper.svg?style=flat-square
[npm-url]: https://npmjs.com/package/propper
[license-img]: http://img.shields.io/npm/l/propper.svg?style=flat-square
[license-url]: LICENSE