draft 
=====

[![draft](http://www.inkity.com/shirtdesigner/prints/clipArt1/S6881113.png)]()

Give your object and models schemas

[![Build Status](https://travis-ci.org/jwerle/draft.png?branch=master)](https://travis-ci.org/jwerle/draft)
[![browser support](https://ci.testling.com/jwerle/draft.png)](https://ci.testling.com/jwerle/draft)

--

## install

*nodejs*

```sh
$ npm install draft --save
```

*component*

```sh
$ component install jwerle/draft
```

*bower*

```sh
$ bower install draft
```

*browser*

```html
<script type="text/javascript" src="https://raw.github.com/jwerle/draft/master/draft.js"></script>
```

## usage

Creating a model with draft is as simple as passing it a schema descriptor

```js
var User = draft({ name: String, email: String })
  , Post = draft({ owner: Object, content: String })

var werle = new User({ name: 'werle', email: 'joseph@werle.io' })
  , post  = new Post({ owner: werle, content: "I like draft :)"})
```

## api

### draft(descriptor, options)

Creates a schema form a descriptor and returns a model constructor

*example*

```js
var Post = draft({
  owner    : User,
  comments : [Comment],
  content  : String,
  created  : Date,
  updated  : Date
});
```
--

### Schema(descriptor, options)

Schema constructor

*  `descriptor` - An object defining a descriptor for the schema instance
*  `options` - An object of options:
  * `strict` - Strict mode. Model from schema will be frozen from schema updates after instantiation. (Default: `true`)

*example*

```js
var schema = new draft.Schema({
  name: String,
  email: String
});
```

#### .add(key, descriptor)

Adds an object to the schema tree

* `key` - A key used to identify the property in the schema
* `descriptor` - An object descriptor or constructor function 

*example*

```js
schema.add({ age: Number });
```

#### .static(name, func)

Creates a static function on the schema's model constructor

* `name` - The name of the static function
* `func` - The actual function

*example*

```js
var siteSchema = new draft.Schema({
  name : String,
  url  : String
});

siteSchema.static('createSites', function createSites (map) {
  return Object.keys(map).map(function (site) {
    return new this({ name: site, url: map[site] });
  }, this);
});

// create Site model
var Site = siteSchema.createModel();

var sites = Site.createSites({
  'google'  : "http://google.com",
  'github'  : "https://github.com",
  'twitter' : "https://twitter.com",
});

sites[0].name; // 'google'
sites[0].url; // 'http://google.com'
sites[1].name; // 'github'
sites[1].url; // 'https://github.com'
```

#### .createModel()

Creates a constructor from the defined schema

*example*

```js
var schema = new draft.Schema({
  name  : String,
  email : String
});

var User = schema.createModel();
var user = new User({ name: 'werle', email: 'joseph@werle.io' });
```

#### .new(data)

Accepts an object of data and passes it to the Model constructor from the Schema instance

* `data` - An object of data to pass to the schema instance model constructor

*example*

```js
var schema = new draft.Schema({
  name   : String,
  albums : [Album],
  fans   : [Fan]
});

var bob = schema.new({
  name: 'bob',
  albums: [new Album({ name: "Sun Is Shining" }), new Album({ name: "Roots of a Legend" }) ],
  fans: [sally, frank, joe]
});
```

#### using schema descriptors

A schema descriptor is a key to type descriptor object. 
The key for each property on the object represents a possible key on a model instance created from the schema instance.

A simple example of a schema who defines a model which accepts an object that defines a single property `name` of the type `string`

```js
new draft.Schema({ name : String })
```

A more advanced example would be to define the descriptor object for the property:

```js
new draft.Schema({
  name: { type: String }
})
```

--

### Tree(descriptor, options)

Tree constructor.
Creates an object tree for a schema. This is used for aggregating types

**A tree instance is intended to be used with a schema**

* `descriptor` - A schema descriptor used to define the tree.
* `options` - An object of options. If present and `array` is set to true then an array is returned who's prototype is an instance of the tree .

*example*

```js
var tree = new draft.Tree({
  name: String
});

// tree.name is an instance of draft.Type who's constructor is a String constructor
tree.name; // { Constructor: [Function: String] }
```

#### .add(parent, key, descriptor)

Adds a key to the tree on a given parent tree. 
Defaults to 'this' as the parent if one is not provided.

* `parent` - The parent tree object in which the descriptor is added to by the provided key. Defaults to the tree instance caller.
* `key` - The key of the item in the tree to add
* `descriptor` - The object descriptor for the key being added to the tree

*example*

```js
var tree = new draft.Tree({
  domain: String
});

tree.add('subdomains', {});
tree.subdomains; // {} (Tree instance)
tree.add(tree.subdomains, 'primary', String);
tree.subdomains.primary; // { Constructor: [Function: String] }
tree.add(tree.subdomains, 'secondary', String);
tree.subdomains.secondary; // { Constructor: [Function: String] }
tree.subdomains.add('cdn', String);
tree.subdomains.cdn; // { Constructor: [Function: String] }
tree.add('host', String);
tree.host; // { Constructor: [Function: String] }
```
--

### Type(Constructor, descriptor)

Type constructor. Creates a Type used in a Tree instance for a Schema instance. 
It is meant to provide methods for validation and coercion.

* `Constructor` - A valid type constructor who will *NEVER* be invoked with the `new` operator
* `descriptor` - A valid schema constructor

*example*

```js
var stringType = new draft.Type(String);
stringType.coerce(123); // '123'

var numberType = new draft.Type(Number);
numberType.coerce('123'); // 123

var booleanType = new draft.Type(Boolean);
booleanType.coerce(1); // true
booleanType.coerce(0); // false
```

Creating a custom type

```js
var customType = new draft.Type(function CustomType (value) {
  return {
    toString: function () {
      return value.toString();
    },

    valueOf: function () {
      return value;
    },

    add: function (n) {
      return CustomType(value + n);
    },

    sub: function (n) {
      return CustomType(value - n);
    }
  };
});

+customType.coerce(4).add(5); // 9
+customType.coerce(10).sub(9); // 1
customType.coerce('j').add('o').add('e').toString(); // 'joe'
```

#### .toString

Returns a string representation of a Type instance

*example*

```js
someType.toString(); // '[object Type]'
```

#### .valueOf

Returns the valueOf return value from the original constructor on the Type instance

```js
var someType.valueOf(); // some value
```

#### .get(value)
Default getter that coerces a value. This method that can be implemented by the descriptor. Defaults to `.coerce()`

```js
var stringType = new draft.Type(String)
stringType.get(12345); // '12345'
```

#### .set(value)

Default setter that coerces a value. This method that can be implemented by the descriptor. Defaults to `.coerce()`

```js
var stringType = new draft.Type(String)
stringType.set(12345); // '12345'
```

#### .validate(input)

Validates a defined type. It performs instance of checks on values that are not primitive. Primitive inputs are validated with a 'typeof' check

* `input` - Mixed input to validate against the type

*example*

```js
var numberType = new draft.Type(Number)

numberType.validate('123'); // false
numberType.validate(true); // false
numberType.validate(123); // true
```

#### .coerce(input)

Coerces a given input with the set Constructor type

* `input` - Input to coerce to a type

*example*

```js
var booleanType = new draft.Type(Boolean)

booleanType.coerce(1); // true
booleanType.coerce(123); // true
booleanType.coerce(0); // false
booleanType.coerce(null); // false
booleanType.coerce(); // false
``` 

--

### Model(data, schema)

Base constructor for all created Model instances. Usually a Model constructor is created from a schema, but passing a schema to a Model constructor works too.

* `data` - An object of data is validated against the schema used to create the Model
* `schema` - An instance of a schema.

*example*

```js
var schema = new draft.Schema({
  name: String,
  email: String
});

var user = new draft.Model({ name: 'werle', email: 'joseph@werle.io' }, schema);
```

#### .refresh()

Refreshes the state of the model based on its schema

#### .set()

Sets data on the model based on the schema

#### .toObject()

Returns a plain object representation of the model

#### .toJSON()

Called with JSON.stringify

#### .toString()

Returns a string representation of a Model instance

#### .valueOf()

Returns a value representation of a Model instance

--

## example

Define a schema for an object with types. Strict mode default

```js
var draft = require('draft')
var schema = new draft.Schema({
  name : String,
  profile : {
    email : String,
    age : Number
  }
});
```

Create a model constructor from the schema defaulting to strict mode

```js
var User = schema.createModel();
```

Instantiate the model passing in an object. In strict mode all properties on an object must be defined in the schema that was used to create it

```js
var user = new User({
  name: 'werle',
  profile: { email: 'joseph@werle.io' },
  somePropertyNotInSchema: 'someValue'
});

```

Only values in the schema were set on the object

```js
user.name // werle
user.profile.email // joseph@werle.io
user.somePropertyNotInSchema // undefined
```

## todo

* write more tests
* document more

## license

MIT
