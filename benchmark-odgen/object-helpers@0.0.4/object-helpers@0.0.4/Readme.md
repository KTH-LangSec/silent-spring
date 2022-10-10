[![Build Status](https://travis-ci.org/sasikanth513/object-props.svg?branch=master)](https://travis-ci.org/sasikanth513/object-props)

Object Helpers
=========

Helper functions to work with Objects

## Installation

  `npm install object-helpers`

## Usage
  
  ```js
    const ObjHelpers = require('object-helpers');
    
    // get
    ObjHelpers.get({ a: { b: 1 } }, 'a.b');
    > Output should be `1`

    ObjHelpers.get({ a: { b: 1 } }, 'a.b.c');
    > Output should be `undefined`

    ObjHelpers.get({ a: { b: 1 } }, 'a.c.b');
    > Output should be `undefined`

    
    // set
    const obj = {a: {b: 1}};

    ObjHelpers.set(obj, 'a.b', 2);
    > Object should be `{a: {b: 2}}`

    ObjHelpers.set({}, 'a.b', 2);
    > Object should be `{a: {b: 2}}`

    ObjHelpers.set(obj, 'a.c.d', 2);
    > Object should be `{a: {b: 2, c: { d: 2 }}}`


    // has
    const obj = {a: {b: 1}};

    ObjHelpers.has({ a: { b: 1 } }, 'a');
    > Output should be `true`

    ObjHelpers.has({ a: { b: 1 } });
    > Output should be `false`

    ObjHelpers.has({ a: { b: 1 } }, 'a.b');
    > Output should be `true`


    // delete
    const obj = {
      a: {
        a1: {
          a11: 'foo'
        }
      },
      b: {
        b1: 'bar'
      }
    };

    ObjHelpers.delete(obj, 'a.a1.a11');
    console.log(obj.a.a1.a11);
    > Output should be `undefined`

    const res = ObjHelpers.delete(obj, 'a.a1.a11.a111');
    > res should be `undefined`

    ObjHelpers.delete(obj, 'a.a1');
    console.log(obj.a.a1)
    > Output should be `undefined`

```
  

## ToDO

[] get values from object
## Tests

  `npm test`

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.