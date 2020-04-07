import * as Memcached from 'memcached';
import { DeepstreamPlugin, DeepstreamCache, StorageReadCallback, StorageWriteCallback, StorageHeadBulkCallback, StorageHeadCallback, DeepstreamConfig, DeepstreamServices } from '@deepstream/types';
interface MemcachedOptions {
    serverLocation: string;
    lifetime: number;
    memcachedOptions?: Memcached.options;
}
/**
 * This class connects deepstream.io to a memcached cache, using the
 * memcached library (https://www.npmjs.com/package/memcached).
 *
 * Please consult https://www.npmjs.com/package/memcached for details
 * on the serverLocation and memcachedOptions setting
 *
 * lifetime is the default lifetime for objects in seconds (defaults to 1000)
 */
export declare class CacheConnector extends DeepstreamPlugin implements DeepstreamCache {
    private options;
    private services;
    description: string;
    private logger;
    private client;
    constructor(options: MemcachedOptions, services: DeepstreamServices, deepstreamConfig: DeepstreamConfig);
    whenReady(): Promise<void>;
    head(recordName: string, callback: StorageHeadCallback): void;
    headBulk(recordNames: string[], callback: StorageHeadBulkCallback): void;
    set(recordName: string, version: number, data: any, callback: StorageWriteCallback, metaData?: any): void;
    get(recordName: string, callback: StorageReadCallback, metaData?: any): void;
    delete(recordName: string, callback: StorageWriteCallback, metaData?: any): void;
    deleteBulk(recordNames: string[], callback: StorageWriteCallback, metaData?: any): void;
}
export default CacheConnector;
