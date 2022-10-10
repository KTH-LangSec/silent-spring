Blindfold
=========

[![Build Status](https://travis-ci.org/gordonwritescode/blindfold.svg)](https://travis-ci.org/gordonwritescode/blindfold)

Blindfold is a simple utility for getting and setting values on objects to
which you may not know the paths (using dot syntax).

## Setup

Install using Node Package Manager:

```
npm install blindfold
```

Or just include a script tag:

```html
<script src="blindfold.js"></script>
```

## Usage

Use the `blindfold` function to get or set a value on a context object.

```js
var obj = { foo: { bar: 'baz' } };

// returns 'baz'
blindfold(obj, 'foo.bar');
// sets obj.foo.bar to { baz: 'beep boop' } and returns it
blindfold(obj, 'foo.bar', { baz: 'beep boop' });
```
