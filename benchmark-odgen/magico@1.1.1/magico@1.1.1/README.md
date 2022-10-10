Magico
=======

[![Build Status](https://travis-ci.org/lyfeyaj/magico.svg?branch=master)](https://travis-ci.org/lyfeyaj/magico)

Magic object accessor for javascript!

# Install

```bash
$ npm install --save magico
```

# Usage

```javascript
const magico = require('magico');

let obj = {
  a: 1,
  b: 2,
  c: {
    d: ['first', 'second'],
    e: {
      f: [1, 2, 3, 4, 5, 6]
    }
  }
};
```

## Class methods


### magico.set(object, path, value)

Set the value of object under the corresponding path.
If success return true, else return false
```javascript
magico.set(obj, 'a', 3);  // => true
magico.set(obj, 'c.d[0]','zero'); // => true
magico.set(obj, 'e.d.a', '2');  // => true
```

The final object
```javascript
{
  a: 3,
  b: 2,
  c: {
    d: [ 'zero', 'second' ],
    e: {
      f: [1, 2, 3, 4, 5, 6]
    }
  },
  e: {
    d: {
      a: '2'
    }
  }
}
```

### magico.get(obj, path)

get the value of object under the corresponding path.
```javascript
magico.get(obj, 'a') // => 3
magico.get(obj, 'c.d[0]') // => 'zero'
magico.get(obj, 'e.d.a') // => '2'
```

### magico.exists(obj, path)
Check if the value of the obj under the corresponding path exists
```javascript
magico.exists(obj, 'a'); // => true
magico.exists(obj, 'c.d[0]'); // => true
magico.exists(obj, 'd'); // => false
magico.exists(obj, 'c.d[2]'); // => false
```

### magico.remove(obj, path)
remove the value of object under the corresponding path
```javascript
magico.remove(obj, 'e.d') // => true
magico.remove(obj, 'c.d[1]') // => true
magico.remove(obj, 'd') // => false
magico.remove(obj, 'c.d[2]') // => false
 ```
The final object
```javascript
{
  a: 3,
  b: 2,
  c: { d: [ 'zero' ] },
  e: {}
}
```

### magico(obj)
Return magico instance
```javascript
const instance = magico(obj);
```

Then, you can use magico methods without passing `obj`

### magico.access(obj, path)
Return magico instance with specific path
```javascript
const instance = magico.access(obj, 'c.e.f');
instance.get(0) // => 1
```

## Instance methods
You can create instance using the class method `magico(obj)` or `magico.wrap(obj)` or `new magico(obj)`
```javascript
const instance1 = magico(obj);
const instance1 = magico.wrap(obj);
const instance2 = new magico(obj);
```
set, get, exists, remove all these methods are similar to class methods
```javascript
const instance = magico(obj)
instance.get(path);
instance.set(path, value);
instance.exists(path);
instance.remove(path);
```

### instance.toObject()
return the changed obj;
```javascript
let obj = {
  a: 1,
  b: 2,
  c: {
    d: ['first', 'second'],
    e: {
      f: [1, 2, 3, 4, 5, 6]
    }
  }
};
const instance = magico(obj);
instance.toObject() // => { a: 3, b: 2, c: { d: [ 'zero' ], e: { f: [Object] } }, e: {} }
instance.set('c.d[0]', 'second'); // => return true
instance.toObject() // => { a: 3, b: 2, c: { d: [ 'second' ], e: { f: [Object] } }, e: {} }
```
