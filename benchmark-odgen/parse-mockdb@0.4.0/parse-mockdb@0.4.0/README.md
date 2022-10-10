Parse MockDB
=====================

Master Build Status: [![Circle CI](https://circleci.com/gh/Hustle/parse-mockdb/tree/master.svg?style=svg)](https://circleci.com/gh/Hustle/parse-mockdb/tree/master)

Provides a mocked Parse RESTController compatible with version `2.0+` of the JavaScript SDK.

### Installation and Usage

```js
npm install parse-mockdb --save-dev
```

```js
'use strict';
const Parse = require('parse-shim');
const ParseMockDB = require('parse-mockdb');

ParseMockDB.mockDB(Parse); // Mock the Parse RESTController

// Perform saves, queries, updates, deletes, etc... using the Parse JS SDK

ParseMockDB.cleanUp(); // Clear the Database
ParseMockDB.unMockDB(); // Un-mock the Parse RESTController
```

### Completeness

 - [x] Basic CRUD (save, destroy, fetch)
 - [x] Query operators ($exists, $in, $nin, $eq, $ne, $lt, $lte, $gt, $gte, $regex, $select, $inQuery, $all, $nearSphere)
 - [x] Update operators (Increment, Add, AddUnique, Remove, Delete)
 - [x] Parse.Relation (AddRelation, RemoveRelation)
 - [x] Parse query dotted notation matching eg `{ "name.first": "Tyler" })`
 - [ ] Parse class level permissions
 - [ ] Parse.ACL (row level permissions)
 - [ ] Parse special classes (Parse.User, Parse.Role, ...)
 - [ ] Parse lifecycle hooks (beforeSave - done, afterSave - done, beforeDelete - done, afterDelete)


### Changelog

### v0.4.0

- *Breaking Change* This library is now targeting the 2.x series of the Parse JS SDK. If you are
  using Parse 1.6+, you should pin to the v0.3.x release.

#### v0.3.0
- *Breaking Change* When calling `mockDB()` you must now pass in a reference to
  the Parse SDK that you want to mock.

- *Breaking Change* Stopped patching MockDB object on to Parse module. You can no longer
  access `Parse.MockDB`, you must load the `parse-mockdb` module explicitly.

- *Breaking Change* Removed ParseMockDB.promiseResultSync method


### Tests

```sh
npm test
```
