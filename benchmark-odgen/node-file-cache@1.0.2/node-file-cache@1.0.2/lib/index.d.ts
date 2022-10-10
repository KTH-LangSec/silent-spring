export interface ICacheOptions {
    file?: string;
    life?: number;
}
export interface IRecordOptions {
    tags?: string[];
    life?: number;
}
export interface Record {
    key: string;
    val: any;
    life: number;
    tags: string[];
}
export declare function create(options?: ICacheOptions): Cache;
export declare class Cache {
    private config;
    private db;
    constructor(options?: ICacheOptions);
    set: (key: string, value: any, options?: IRecordOptions) => Cache;
    get: (key: string) => any;
    /**
     * Clears all records from cache storage
     */
    clear: () => Cache;
    /**
     * Removes records from cache storage
     */
    expire(value: any): Cache;
    size(): number;
    private _set(records);
    private _createRecord(key, value, options);
    private _createTimestamp();
    private _merge(a, b);
}
