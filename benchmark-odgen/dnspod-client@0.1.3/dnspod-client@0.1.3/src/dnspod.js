var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    HTTPS = require('https'),
    querystring = require('querystring'),
    net = require('net');
/*
* Recursively merge properties of two objects
*/
function mergeJSON(obj1, obj2) {
    if (obj2) {
        Object.keys(obj2).forEach(function (p) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor === Object) {
                    obj1[p] = mergeJSON(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];
            }
        });
    }

    return obj1;
}

function Dnspod(params, options) {
    var self = this;
    self.defParams = mergeJSON({
        'login_email': '',
        'login_password': '',
        'format': 'json',
        'lang': 'cn',
        'error_on_empty': 'yes'
    }, params);

    self.defOptions = mergeJSON({
        host: 'dnsapi.cn',
        port: 443,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/json',
            'User-Agent': 'Node Dnspod Client/1.0.0'
        }
    }, options);
}

util.inherits(Dnspod, EventEmitter);

Dnspod.prototype.getHostIp = function () {
    var self = this,
        message = '',
        client;

    client = net.connect({
        host: 'ns1.dnspod.net',
        port: 6666
    }, function () {
        // console.log('client connected');
    }).on('data', function (data) {
        message = data.toString();
        // console.log(message);
        client.end();
    }).on('end', function () {
        // console.log('client disconnected');
        process.nextTick(function () {
            self.emit('getHostIp', null, message);
        });
    }).on('error', function (err) {
        self.emit('error', err);
    });
    return self;
};

Dnspod.prototype.request = function (url, params, eventListenerName) {
    var self = this,
        requestCallback,
        postParams,
        postData,
        postOptions,
        req;

    postParams = self.defParams;
    if (params) {
        postParams = mergeJSON(postParams, params);
    }

    postData = querystring.stringify(postParams);

    postOptions = self.defOptions;
    postOptions.path = url;
    postOptions.headers['Content-Length'] = postData.length;

    requestCallback = function (res) {
        var resData = [];
        res.on('data', function (data) {
            resData.push(data);
        }).on('end', function () {
            var jsonData,
                err;
            try {
                jsonData = JSON.parse(resData.join(''));
            } catch (ex) {
                console.log(ex);
                err = ex;
            } finally {
                process.nextTick(function () {
                    if (err) {
                        self.emit(eventListenerName, new Error('Request failed'));
                    } else {
                        self.emit(eventListenerName, null, jsonData);
                    }
                });
            }
        });
    };

    req = HTTPS.request(postOptions, requestCallback);
    req.on('error', function (err) {
        self.emit('error', err);
    });
    req.write(postData);
    req.end();
    return self;
};

(function () {
    var mapper = {
        infoVersion: 'Info.Version',
        userDetail: 'User.Detail',
        userModify: 'User.Modify',
        userpasswdModify: 'Userpasswd.Modify',
        useremailModify: 'Useremail.Modify',
        telephoneverifyCode: 'Telephoneverify.Code',
        userLog: 'User.Log',
        domainCreate: 'Domain.Create',
        domainList: 'Domain.List',
        domainRemove: 'Domain.Remove',
        domainStatus: 'Domain.Status',
        domainInfo: 'Domain.Info',
        domainLog: 'Domain.Log',
        domainSearchenginepush: 'Domain.Searchenginepush',
        domainUrlincn: 'Domain.Urlincn',
        domainshareCreate: 'Domainshare.Create',
        domainshareList: 'Domainshare.List',
        domainshareModify: 'Domainshare.Modify',
        domainshareRemove: 'Domainshare.Remove',
        domainTransfer: 'Domain.Transfer',
        domainLock: 'Domain.Lock',
        domainLockstatus: 'Domain.Lockstatus',
        domainUnlock: 'Domain.Unlock',
        domainaliasList: 'Domainalias.List',
        domainaliasCreate: 'Domainalias.Create',
        domainaliasRemove: 'Domainalias.Remove',
        domaingroupList: 'Domaingroup.List',
        domaingroupCreate: 'Domaingroup.Create',
        domaingroupModify: 'Domaingroup.Modify',
        domaingroupRemove: 'Domaingroup.Remove',
        domainChangegroup: 'Domain.Changegroup',
        domainIsmark: 'Domain.Ismark',
        domainRemark: 'Domain.Remark',
        domainPurview: 'Domain.Purview',
        domainAcquire: 'Domain.Acquire',
        domainAcquiresend: 'Domain.Acquiresend',
        domainAcquirevalidate: 'Domain.Acquirevalidate',
        recordType: 'Record.Type',
        recordLine: 'Record.Line',
        recordCreate: 'Record.Create',
        recordList: 'Record.List',
        recordModify: 'Record.Modify',
        recordRemove: 'Record.Remove',
        recordDdns: 'Record.Ddns',
        recordRemark: 'Record.Remark',
        recordInfo: 'Record.Info',
        recordStatus: 'Record.Status',
        monitorListsubdomain: 'Monitor.Listsubdomain',
        monitorListsubvalue: 'Monitor.Listsubvalue',
        monitorList: 'Monitor.List',
        monitorCreate: 'Monitor.Create',
        monitorModify: 'Monitor.Modify',
        monitorRemove: 'Monitor.Remove',
        monitorInfo: 'Monitor.Info',
        monitorSetstatus: 'Monitor.Setstatus',
        monitorGethistory: 'Monitor.Gethistory',
        monitorUserdesc: 'Monitor.Userdesc',
        monitorGetdowns: 'Monitor.Getdowns'
    };

    Object.keys(mapper).forEach(function (key) {
        Dnspod.prototype[key] = (function (key, value) {
            return function (params) {
                return this.request('/' + value, params, key);
            };
        }(key, mapper[key]));
    });

}());

module.exports = Dnspod;
