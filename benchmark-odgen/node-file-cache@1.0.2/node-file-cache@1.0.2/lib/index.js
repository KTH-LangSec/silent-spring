'use strict';
var database = require('lowdb');
var util = require('util');
function create(options) {
    return new Cache(options || {});
}
exports.create = create;
var Cache = (function () {
    function Cache(options) {
        this.set = function (key, value, options) {
            var record = this._createRecord(key, value, options || {});
            this.expire(key); // remove previous
            this.db.get('index').push(record).value();
            return this;
        };
        this.get = function (key) {
            var record = this.db.get('index').find({ key: key }).value();
            if (!record)
                return null;
            if (record.life < this._createTimestamp()) {
                this.expire(key);
                return null; // expired 
            }
            return record.val;
        };
        /**
         * Clears all records from cache storage
         */
        this.clear = function () {
            this.db.set('index', []).value();
            return this;
        };
        this.config = this._merge({
            file: 'store.json',
            life: 3600 // one hour
        }, options || {});
        this.db = database(this.config.file);
        this.db.defaults({
            index: []
        }).value();
    }
    /**
     * Removes records from cache storage
     */
    Cache.prototype.expire = function (value) {
        var _ = this.db._;
        var removed, staying;
        switch (true) {
            case util.isFunction(value):
                // remove by filter callback
                removed = this.db.get('index')
                    .filter(value)
                    .map('key')
                    .value();
                break;
            case util.isArray(value):
                // remove by tags
                removed = this.db.get('index')
                    .filter(function (record) { return _.intersection(record.tags, value).length; })
                    .map('key')
                    .value();
                break;
            case util.isString(value):
                // remove by key
                removed = this.db.get('index')
                    .filter(function (record) { return record.key === value; })
                    .map('key')
                    .value();
                break;
            default:
                throw new Error('Unsupported expiration method: ' + (typeof value));
        }
        staying = this.db.get('index')
            .filter(function (record) { return removed.indexOf(record.key) < 0; })
            .value();
        this._set(staying);
        return this;
    };
    Cache.prototype.size = function () {
        return this.db.get('index').value().length;
    };
    Cache.prototype._set = function (records) {
        this.db.set('index', records).value();
    };
    Cache.prototype._createRecord = function (key, value, options) {
        var tags = options.tags || [];
        var span = options.life || this.config.life;
        var life = span * 1000 + this._createTimestamp();
        return {
            key: key,
            val: value,
            life: life,
            tags: tags
        };
    };
    Cache.prototype._createTimestamp = function () {
        return new Date().getTime();
    };
    Cache.prototype._merge = function (a, b) {
        for (var p in b) {
            try {
                if (b[p].constructor === Object) {
                    a[p] = this._merge(a[p], b[p]);
                }
                else {
                    a[p] = b[p];
                }
            }
            catch (e) {
                a[p] = b[p];
            }
        }
        return a;
    };
    return Cache;
}());
exports.Cache = Cache;
//# sourceMappingURL=index.js.map