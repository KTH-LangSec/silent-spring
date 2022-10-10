# Dnspod-client

Dnspod-client is a client of [DNSPod](http://www.dnspod.cn).
It was originally designed for use with [node.js](http://nodejs.org).


## Quick Examples

```javascript
var Dnspod = require('dnspod-client'),
    client = new Dnspod({
        'login_email': 'test@test.com',
        'login_password': 'test'
    });

client
    .domainList({length: 5})
    .on('domainList', function (err, data) {
        if (err) {
            throw err;
        } else {
            done();
        }
    });

client
    .getHostIp()
    .on('getHostIp', function (err, message) {
        if (err) {
            throw err;
        } else {
            console.log('get IP address: ' + message);
            done();
        }
    });

```


## Download

You can install using Node Package Manager (npm):

```sh
npm install dnspod-client
```


## License

Copyright (c) 2012 Chao Shen. This software is licensed under the BSD License.
