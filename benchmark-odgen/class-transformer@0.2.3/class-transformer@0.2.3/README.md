# class-transformer

[![Build Status](https://travis-ci.org/typestack/class-transformer.svg?branch=master)](https://travis-ci.org/typestack/class-transformer)
[![codecov](https://codecov.io/gh/typestack/class-transformer/branch/master/graph/badge.svg)](https://codecov.io/gh/typestack/class-transformer)
[![npm version](https://badge.fury.io/js/class-transformer.svg)](https://badge.fury.io/js/class-transformer)
[![Dependency Status](https://david-dm.org/typestack/class-transformer.svg)](https://david-dm.org/typestack/class-transformer)
[![Join the chat at https://gitter.im/typestack/class-transformer](https://badges.gitter.im/typestack/class-transformer.svg)](https://gitter.im/typestack/class-transformer?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Its ES6 and Typescript era. Nowadays you are working with classes and constructor objects more then ever.
Class-transformer allows you to transform plain object to some instance of class and versa.
Also it allows to serialize / deserialize object based on criteria.
This tool is super useful on both frontend and backend.

Example how to use with angular 2 in [plunker](http://plnkr.co/edit/Mja1ZYAjVySWASMHVB9R).
Source code is available [here](https://github.com/pleerock/class-transformer-demo).

## What is class-transformer

In JavaScript there are two types of objects:

* plain (literal) objects
* class (constructor) objects

Plain objects are objects that are instances of `Object` class.
Sometimes they are called **literal** objects, when created via `{}` notation.
Class objects are instances of classes with own defined constructor, properties and methods.
Usually you define them via `class` notation.

So, what is the problem?

Sometimes you want to transform plain javascript object to the ES6 **classes** you have.
For example, if you are loading a json from your backend, some api or from a json file,
and after you `JSON.parse` it you have a plain javascript object, not instance of class you have.

For example you have a list of users in your `users.json` that you are loading:

```json
[{
  "id": 1,
  "firstName": "Johny",
  "lastName": "Cage",
  "age": 27
},
{
  "id": 2,
  "firstName": "Ismoil",
  "lastName": "Somoni",
  "age": 50
},
{
  "id": 3,
  "firstName": "Luke",
  "lastName": "Dacascos",
  "age": 12
}]
```
And you have a `User` class:

```javascript
export class User {
    id: number;
    firstName: string;
    lastName: string;
    age: number;

    getName() {
        return this.firstName + " " + this.lastName;
    }

    isAdult() {
        return this.age > 36 && this.age < 60;
    }
}
```

You are assuming that you are downloading users of type `User` from `users.json` file and may want to write
following code:

```javascript
fetch("users.json").then((users: User[]) => {
    // you can use users here, and type hinting also will be available to you,
    //  but users are not actually instances of User class
    // this means that you can't use methods of User class
});
```

In this code you can use `users[0].id`, you can also use `users[0].firstName` and `users[0].lastName`.
However you cannot use `users[0].getName()` or `users[0].isAdult()` because "users" actually is
array of plain javascript objects, not instances of User object.
You actually lied to compiler when you said that its `users: User[]`.

So what to do? How to make a `users` array of instances of `User` objects instead of plain javascript objects?
Solution is to create new instances of User object and manually copy all properties to new objects.
But things may go wrong very fast once you have a more complex object hierarchy.

Alternatives? Yes, you can use class-transformer. Purpose of this library is to help you to map you plain javascript
objects to the instances of classes you have.

This library also great for models exposed in your APIs,
because it provides a great tooling to control what your models are exposing in your API.
Here is example how it will look like:

```javascript
fetch("users.json").then((users: Object[]) => {
    const realUsers = plainToClass(User, users);
    // now each user in realUsers is instance of User class
});
```

Now you can use `users[0].getName()` and `users[0].isAdult()` methods.

## Installation

### Node.js

1. Install module:

    `npm install class-transformer --save`

2. `reflect-metadata` shim is required, install it too:

    `npm install reflect-metadata --save`

    and make sure to import it in a global place, like app.ts:

    ```javascript
    import "reflect-metadata";
    ```

3. ES6 features are used, if you are using old version of node.js you may need to install es6-shim:

   `npm install es6-shim --save`

   and import it in a global place like app.ts:

    ```javascript
    import "es6-shim";
    ```

### Browser

1. Install module:

    `npm install class-transformer --save`

2. `reflect-metadata` shim is required, install it too:

    `npm install reflect-metadata --save`

    add `<script>` to reflect-metadata in the head of your `index.html`:

    ```html
    <html>
       <head>
           <!-- ... -->
           <script src="node_modules/reflect-metadata/Reflect.js"></script>
       </head>
       <!-- ... -->
    </html>
    ```

    If you are using angular 2 you should already have this shim installed.

3. If you are using system.js you may want to add this into `map` and `package` config:

    ```json
    {
        "map": {
            "class-transformer": "node_modules/class-transformer"
        },
        "packages": {
            "class-transformer": { "main": "index.js", "defaultExtension": "js" }
        }
    }
    ```

## Methods

#### plainToClass

This method transforms a plain javascript object to instance of specific class.

```javascript
import {plainToClass} from "class-transformer";

let users = plainToClass(User, userJson); // to convert user plain object a single user. also supports arrays
```

#### plainToClassFromExist

This method transforms a plain object into a instance using a already filled Object which is a instance from the target class.

```javascript
const defaultUser = new User();
defaultUser.role = 'user';

let mixedUser = plainToClassFromExist(defaultUser, user); // mixed user should have the value role = user when no value is set otherwise.
```

#### classToPlain

This method transforms your class object back to plain javascript object, that can be `JSON.stringify` later.

```javascript
import {classToPlain} from "class-transformer";
let photo = classToPlain(photo);
```

#### classToClass

This method transforms your class object into new instance of the class object.
This maybe treated as deep clone of your objects.

```javascript
import {classToClass} from "class-transformer";
let photo = classToClass(photo);
```

You can also use a `ignoreDecorators` option in transformation options to ignore all decorators you classes is using.

#### serialize

You can serialize your model right to the json using `serialize` method:

```javascript
import {serialize} from "class-transformer";
let photo = serialize(photo);
```

`serialize` works with both arrays and non-arrays.

#### deserialize and deserializeArray

You can deserialize your model to from a json using `deserialize` method:

```javascript
import {deserialize} from "class-transformer";
let photo = deserialize(Photo, photo);
```

To make deserialization to work with arrays use `deserializeArray` method:

```javascript
import {deserializeArray} from "class-transformer";
let photos = deserializeArray(Photo, photos);
```

## Enforcing type-safe instance

The default behaviour of the `plainToClass` method is to set *all* properties from the plain object,
even those which are not specified in the class.

```javascript
import {plainToClass} from "class-transformer";

class User {
  id: number
  firstName: string
  lastName: string
}

const fromPlainUser = {
  unkownProp: 'hello there',
  firstName: 'Umed',
  lastName: 'Khudoiberdiev',
}

console.log(plainToClass(User, fromPlainUser))

// User {
//   unkownProp: 'hello there',
//   firstName: 'Umed',
//   lastName: 'Khudoiberdiev',
// }
```

If this behaviour does not suit your needs, you can use the `excludeExtraneousValues` option
in the `plainToClass` method while *exposing all your class properties* as a requirement.

```javascript
import {Expose, plainToClass} from "class-transformer";

class User {
    @Expose() id: number;
    @Expose() firstName: string;
    @Expose() lastName: string;
}

const fromPlainUser = {
  unkownProp: 'hello there',
  firstName: 'Umed',
  lastName: 'Khudoiberdiev',
}

console.log(plainToClass(User, fromPlainUser, { excludeExtraneousValues: true }))

// User {
//   id: undefined,
//   firstName: 'Umed',
//   lastName: 'Khudoiberdiev'
// }
```

## Working with nested objects

When you are trying to transform objects that have nested objects,
its required to known what type of object you are trying to transform.
Since Typescript does not have good reflection abilities yet,
we should implicitly specify what type of object each property contain.
This is done using `@Type` decorator.

Lets say we have an album with photos.
And we are trying to convert album plain object to class object:

```javascript
import {Type, plainToClass} from "class-transformer";

export class Album {

    id: number;

    name: string;

    @Type(() => Photo)
    photos: Photo[];
}

export class Photo {
    id: number;
    filename: string;
}

let album = plainToClass(Album, albumJson);
// now album is Album object with Photo objects inside
```

### Providing more than one type option

In case the nested object can be of different types, you can provide an additional options object,
that specifies a discriminator. The discriminator option must define a `property` that holds the sub
type name for the object and the possible `subTypes`, the nested object can converted to. A sub type
has a `value`, that holds the constructor of the Type and the `name`, that can match with the `property`
of the discriminator.

Lets say we have an album that has a top photo. But this photo can be of certain different types.
And we are trying to convert album plain object to class object. The plain object input has to define
the additional property `__type`. This property is removed during transformation by default:

**JSON input**:
```json
{
    "id": 1,
    "name": "foo",
    "topPhoto": {
        "id": 9,
        "filename": "cool_wale.jpg",
        "depth": 1245,
        "__type": "underwater"
    }
}
```

```javascript
import {Type, plainToClass} from "class-transformer";

export abstract class Photo {
    id: number;
    filename: string;
}

export class Landscape extends Photo {
    panorama: boolean;
}

export class Portrait extends Photo {
    person: Person;
}

export class UnderWater extends Photo {
    depth: number;
}

export class Album {

    id: number;
    name: string;

    @Type(() => Photo, {
        discriminator: {
            property: "__type",
            subTypes: [
                { value: Landscape, name: "landscape" },
                { value: Portrait, name: "portrait" },
                { value: UnderWater, name: "underwater" }
            ]
        }
    })
    topPhoto: Landscape | Portrait | UnderWater;

}

let album = plainToClass(Album, albumJson);
// now album is Album object with a UnderWater object without `__type` property.
```

Hint: The same applies for arrays with different sub types. Moreover you can specify `keepDiscriminatorProperty: true`
in the options to keep the discriminator property also inside your resulting class.

## Exposing getters and method return values

You can expose what your getter or method return by setting a `@Expose()` decorator to those getters or methods:

```javascript
import {Expose} from "class-transformer";

export class User {

    id: number;
    firstName: string;
    lastName: string;
    password: string;

    @Expose()
    get name() {
        return this.firstName + " " + this.lastName;
    }

    @Expose()
    getFullName() {
        return this.firstName + " " + this.lastName;
    }
}
```

## Exposing properties with different names

If you want to expose some of properties with a different name,
you can do it by specifying a `name` option to `@Expose` decorator:

```javascript
import {Expose} from "class-transformer";

export class User {

    @Expose({ name: "uid" })
    id: number;

    firstName: string;

    lastName: string;

    @Expose({ name: "secretKey" })
    password: string;

    @Expose({ name: "fullName" })
    getFullName() {
        return this.firstName + " " + this.lastName;
    }
}
```

## Skipping specific properties

Sometimes you want to skip some properties during transformation.
This can be done using `@Exclude` decorator:

```javascript
import {Exclude} from "class-transformer";

export class User {

    id: number;

    email: string;

    @Exclude()
    password: string;
}
```

Now when you transform a User, `password` property will be skipped and not be included in the transformed result.

## Skipping depend of operation

You can control on what operation you will exclude a property. Use `toClassOnly` or `toPlainOnly` options:

```javascript
import {Exclude} from "class-transformer";

export class User {

    id: number;

    email: string;

    @Exclude({ toPlainOnly: true })
    password: string;
}
```

Now `password` property will be excluded only during `classToPlain` operation. Oppositely, use `toClassOnly` option.

## Skipping all properties of the class

You can skip all properties of the class, and expose only those are needed explicitly:

```javascript
import {Exclude, Expose} from "class-transformer";

@Exclude()
export class User {

    @Expose()
    id: number;

    @Expose()
    email: string;

    password: string;
}
```

Now `id` and `email` will be exposed, and password will be excluded during transformation.
Alternatively, you can set exclusion strategy during transformation:

```javascript
import {classToPlain} from "class-transformer";
let photo = classToPlain(photo, { strategy: "excludeAll" });
```

In this case you don't need to `@Exclude()` a whole class.

## Skipping private properties, or some prefixed properties

If you name your private properties with a prefix, lets say with `_`,
then you can exclude such properties from transformation too:

```javascript
import {classToPlain} from "class-transformer";
let photo = classToPlain(photo, { excludePrefixes: ["_"] });
```

This will skip all properties that start with `_` prefix.
You can pass any number of prefixes and all properties that begin with these prefixes will be ignored.
For example:

```javascript
import {Expose} from "class-transformer";

export class User {

    id: number;
    private _firstName: string;
    private _lastName: string;
    _password: string;

    setName(firstName: string, lastName: string) {
        this._firstName = firstName;
        this._lastName = lastName;
    }

    @Expose()
    get name() {
        return this.firstName + " " + this.lastName;
    }

}

const user = new User();
user.id = 1;
user.setName("Johny", "Cage");
user._password = 123;

const plainUser = classToPlain(user, { excludePrefixes: ["_"] });
// here plainUser will be equal to
// { id: 1, name: "Johny Cage" }
```

## Using groups to control excluded properties

You can use groups to control what data will be exposed and what will not be:

```javascript
import {Exclude, Expose} from "class-transformer";

@Exclude()
export class User {

    id: number;

    name: string;

    @Expose({ groups: ["user", "admin"] }) // this means that this data will be exposed only to users and admins
    email: string;

    @Expose({ groups: ["user"] }) // this means that this data will be exposed only to users
    password: string;
}
```

```javascript
import {classToPlain} from "class-transformer";
let user1 = classToPlain(user, { groups: ["user"] }); // will contain id, name, email and password
let user2 = classToPlain(user, { groups: ["admin"] }); // will contain id, name and email
```

## Using versioning to control exposed and excluded properties

If you are building an API that has different versions, class-transformer has extremely useful tools for that.
You can control which properties of your model should be exposed or excluded in what version. Example:

```javascript
import {Exclude, Expose} from "class-transformer";

@Exclude()
export class User {

    id: number;

    name: string;

    @Expose({ since: 0.7, until: 1 }) // this means that this property will be exposed for version starting from 0.7 until 1
    email: string;

    @Expose({ since: 2.1 }) // this means that this property will be exposed for version starting from 2.1
    password: string;
}
```

```javascript
import {classToPlain} from "class-transformer";
let user1 = classToPlain(user, { version: 0.5 }); // will contain id and name
let user2 = classToPlain(user, { version: 0.7 }); // will contain id, name and email
let user3 = classToPlain(user, { version: 1 }); // will contain id and name
let user4 = classToPlain(user, { version: 2 }); // will contain id and name
let user5 = classToPlain(user, { version: 2.1 }); // will contain id, name nad password
```

## Сonverting date strings into Date objects

Sometimes you have a Date in your plain javascript object received in a string format.
And you want to create a real javascript Date object from it.
You can do it simply by passing a Date object to the `@Type` decorator:

```javascript
import {Type} from "class-transformer";

export class User {

    id: number;

    email: string;

    password: string;

    @Type(() => Date)
    registrationDate: Date;
}
```

Note, that dates will be converted to strings when you'll try to convert class object to plain object.

Same technique can be used with `Number`, `String`, `Boolean`
primitive types when you want to convert your values into these types.

## Working with arrays

When you are using arrays you must provide a type of the object that array contains.
This type, you specify in a `@Type()` decorator:

```javascript
import {Type} from "class-transformer";

export class Photo {

    id: number;

    name: string;

    @Type(() => Album)
    albums: Album[];
}
```

You can also use custom array types:

```javascript
import {Type} from "class-transformer";

export class AlbumCollection extends Array<Album> {
    // custom array functions ...
}

export class Photo {

    id: number;

    name: string;

    @Type(() => Album)
    albums: AlbumCollection;
}
```

Library will handle proper transformation automatically.

ES6 collections `Set` and `Map` also require the `@Type` decorator:

```javascript
export class Skill {
    name: string;
}

export class Weapon {
    name: string;
    range: number;
}

export class Player {
    name: string;

    @Type(() => Skill)
    skills: Set<Skill>;

    @Type(() => Weapon)
    weapons: Map<string, Weapon>;
}
```

## Additional data transformation

### Basic usage

You can perform additional data transformation using `@Transform` decorator.
For example, you want to make your `Date` object to be a `moment` object when you are
transforming object from plain to class:

```javascript
import {Transform} from "class-transformer";
import * as moment from "moment";
import {Moment} from "moment";

export class Photo {

    id: number;

    @Type(() => Date)
    @Transform(value => moment(value), { toClassOnly: true })
    date: Moment;
}
```

Now when you call `plainToClass` and send a plain representation of the Photo object,
it will convert a date value in your photo object to moment date.
`@Transform` decorator also supports groups and versioning.

### Advanced usage

The `@Transform` decorator is given more arguments to let you configure how you want the transformation to be done.

```
@Transform((value, obj, type) => value)
```

| Argument          | Description
|--------------------|---------------------------------------------------------------------------------|
| `value` | The property value before the transformation.
| `obj` | The transformation source object.
| `type` | The transformation type.

## Other decorators
| Signature          | Example                                  | Description
|--------------------|------------------------------------------|---------------------------------------------|
| `@TransformClassToPlain` | `@TransformClassToPlain({ groups: ["user"] })` | Transform the method return with classToPlain and expose the properties on the class.
| `@TransformClassToClass` | `@TransformClassToClass({ groups: ["user"] })` | Transform the method return with classToClass and expose the properties on the class.
| `@TransformPlainToClass` | `@TransformPlainToClass(User, { groups: ["user"] })` | Transform the method return with plainToClass and expose the properties on the class.

The above decorators accept one optional argument:
ClassTransformOptions - The transform options like groups, version, name

An example:

```javascript
@Exclude()
class User {

    id: number;

    @Expose()
    firstName: string;

    @Expose()
    lastName: string;

    @Expose({ groups: ['user.email'] })
    email: string;

    password: string;
}

class UserController {

    @TransformClassToPlain({ groups: ['user.email'] })
    getUser() {
        const user = new User();
        user.firstName = "Snir";
        user.lastName = "Segal";
        user.password = "imnosuperman";

        return user;
    }
}

const controller = new UserController();
const user = controller.getUser();
```

the `user` variable will contain only firstName,lastName, email properties becuase they are
the exposed variables. email property is also exposed becuase we metioned the group "user.email".

## Working with generics

Generics are not supported because TypeScript does not have good reflection abilities yet.
Once TypeScript team provide us better runtime type reflection tools, generics will be implemented.
There are some tweaks however you can use, that maybe can solve your problem.
[Checkout this example.](https://github.com/pleerock/class-transformer/tree/master/sample/sample4-generics)

## Implicit type conversion

> **NOTE** If you use class-validator together with class-transformer you propably DON'T want to enable this function.

Enables automatic conversion between built-in types based on type information provided by Typescript. Disabled by default.

```ts
import { IsString } from 'class-validator'

class MyPayload {

  @IsString()
  prop: string
}


const result1 = plainToClass(MyPayload, { prop: 1234 }, { enableImplicitConversion: true });
const result2 = plainToClass(MyPayload, { prop: 1234 }, { enableImplicitConversion: false });

/**
 *  result1 will be `{ prop: "1234" }` - notice how the prop value has been converted to string.
 *  result2 will be `{ prop: 1234 }` - default behaviour
 */
```

## How does it handle circular references?

Circular references are ignored.
For example, if you are transforming class `User` that contains property `photos` with type of `Photo`,
 and `Photo` contains link `user` to its parent `User`, then `user` will be ignored during transformation.
Circular references are not ignored only during `classToClass` operation.

## Example with Angular2

Lets say you want to download users and want them automatically to be mapped to the instances of `User` class.

```javascript
import {plainToClass} from "class-transformer";

this.http
    .get("users.json")
    .map(res => res.json())
    .map(res => plainToClass(User, res as Object[]))
    .subscribe(users => {
        // now "users" is type of User[] and each user has getName() and isAdult() methods available
        console.log(users);
    });
```

You can also inject a class `ClassTransformer` as a service in `providers`, and use its methods.

Example how to use with angular 2 in [plunker](http://plnkr.co/edit/Mja1ZYAjVySWASMHVB9R).
Source code is [here](https://github.com/pleerock/class-transformer-demo).

## Samples

Take a look on samples in [./sample](https://github.com/pleerock/class-transformer/tree/master/sample) for more examples of
usages.

## Release notes

See information about breaking changes and release notes [here](https://github.com/pleerock/class-transformer/tree/master/doc/release-notes.md).
