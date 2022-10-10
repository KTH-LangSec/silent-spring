'use strict';

import * as database from 'lowdb';
import * as crypto from 'crypto';
import * as util from 'util';

export interface ICacheOptions
{
    file?: string
    life?: number
}

export interface IRecordOptions
{
    tags?: string[],
    life?: number
}

export interface Record
{
    key: string
    val: any
    life: number
    tags: string[]
}

export function create (options?: ICacheOptions)
{
    return new Cache(options || {});
}

export class Cache 
{
    private config: ICacheOptions;
    private db: any;

    constructor (options?: ICacheOptions)
    {
        this.config = this._merge({
            file: 'store.json',
            life: 3600  // one hour
        }, options || {});

        this.db = database(this.config.file);
        this.db.defaults({
            index: []
        }).value();
    }

    public set = function (key: string, value: any, options?: IRecordOptions): Cache
    {
        let record = this._createRecord(key, value, options || {});

        this.expire(key);   // remove previous
        this.db.get('index').push(record).value();
        return this;
    }

    public get = function (key: string): any
    {
        let record = this.db.get('index').find({ key: key }).value();

        if (!record) return null;

        if (record.life < this._createTimestamp()) {
            this.expire(key);
            return null;    // expired 
        }
        
        return record.val;
    }

    /**
     * Clears all records from cache storage
     */
    public clear = function (): Cache
    {
        this.db.set('index', []).value();
        return this;
    }

    /**
     * Removes records from cache storage
     */
    public expire (value: any): Cache
    {
        const _ = this.db._;
        let removed: string[], 
            staying: Record[];

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
                            .filter((record) => _.intersection(record.tags, value).length)
                            .map('key')
                            .value();
                break;

            case util.isString(value):
                // remove by key
                removed = this.db.get('index')
                            .filter((record) => record.key === value)
                            .map('key')
                            .value();
                break;

            default: 
                throw new Error('Unsupported expiration method: ' + (typeof value)); 
        }

        staying = this.db.get('index')
                    .filter((record) => removed.indexOf(record.key) < 0)
                    .value();
        this._set(staying);

        return this;
    }

    public size (): number 
    {
        return this.db.get('index').value().length;  
    }

    private _set (records: Record[]): void
    {
        this.db.set('index', records).value();
    }

    private _createRecord (key: string, value: any, options: IRecordOptions): Record
    {
        let tags = options.tags || [];
        let span = options.life || this.config.life;
        let life = span * 1000 + this._createTimestamp();

        return {
            key: key,
            val: value,
            life: life,
            tags: tags
        };
    }

    private _createTimestamp (): number 
    {
        return new Date().getTime();  
    }

    private _merge (a: any|any[], b: any|any[]): any|any[] 
    {
        for (let p in b) {
            try {
                if (b[p].constructor === Object) {
                    a[p] = this._merge(a[p], b[p]);
                } else {
                    a[p] = b[p];
                }
            } catch (e) {
                a[p] = b[p];
            }
        }
        return a;
    }
    
}