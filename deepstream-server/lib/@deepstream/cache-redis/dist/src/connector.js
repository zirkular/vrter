"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connection_1 = require("./connection");
const pkg = require("../package.json");
const types_1 = require("@deepstream/types");
/**
 * A [deepstream](http://deepstream.io) cache connector
 * for [Redis](http://redis.io)
 *
 * Since Redis, on top of caching key/value combinations in
 * memory, writes them to disk it can make a storage connector
 * obsolete
 *
 * @param {Object} options redis connection options. Please see ./connection.js
 *                         for details
 *
 * @constructor
 */
class CacheConnector extends types_1.DeepstreamPlugin {
    constructor(pluginOptions, services, deepstreamConfig) {
        super();
        this.pluginOptions = pluginOptions;
        this.services = services;
        this.isReady = false;
        this.description = `Redis Cache Connector ${pkg.version}`;
        this.readBuffer = new Map();
        this.writeBuffer = new Map();
        this.timeoutSet = false;
        this.logger = this.services.logger.getNameSpace('REDIS_CACHE');
        this.flush = this.flush.bind(this);
        this.connection = new connection_1.Connection(pluginOptions, this.logger);
    }
    async whenReady() {
        await this.connection.whenReady();
    }
    /**
     * Gracefully close the connection to redis
     */
    async close() {
        await this.connection.close();
    }
    headBulk(recordNames, callback) {
        this.connection.client.mget(recordNames.map((name) => `${name}_v`), (error, result) => {
            const r = recordNames.reduce((v, name, index) => {
                if (result[index] !== null) {
                    v.v[name] = Number(result[index]);
                }
                else {
                    v.m.push(name);
                }
                return v;
            }, { v: {}, m: [] });
            callback(error, r.v, r.m);
        });
    }
    head(recordName, callback) {
        throw new Error('Head is not yet required by deepstream.');
    }
    deleteBulk(recordNames, callback) {
        const pipeline = this.connection.client.pipeline();
        pipeline.del(recordNames.map((name) => `${name}_v`));
        pipeline.del(recordNames.map((name) => `${name}_d`));
        pipeline.exec(callback);
    }
    /**
     * Deletes an entry from the cache.
     */
    delete(recordName, callback) {
        if (this.writeBuffer.has(recordName)) {
            console.trace(`deepstream-redis: A write action is already registered for ${recordName}`);
        }
        this.writeBuffer.set(recordName, { action: 'delete', callback });
        this.scheduleFlush();
    }
    /**
     * Writes a value to the cache.
     */
    set(recordName, version, data, callback) {
        if (this.writeBuffer.has(recordName)) {
            console.trace(`deepstream-redis: A write action is already registered for ${recordName}`);
        }
        this.writeBuffer.set(recordName, { action: 'set', callback, version, data });
        this.scheduleFlush();
    }
    /**
     * Retrieves a value from the cache
     */
    get(key, callback) {
        if (this.writeBuffer.has(key)) {
            console.log(`deepstream-redis: A write action is registered for ${key}`);
        }
        const callbacks = this.readBuffer.get(key);
        if (!callbacks) {
            this.readBuffer.set(key, callback);
        }
        else if (typeof callbacks === 'function') {
            this.logger.warn('MULTIPLE_CACHE_GETS', `Multiple cache gets for record ${key}`, { recordName: key });
            this.readBuffer.set(key, [callbacks, callback]);
        }
        else {
            callbacks.push(callback);
        }
        this.scheduleFlush();
    }
    scheduleFlush() {
        if (this.readBuffer.size + this.writeBuffer.size > 5000) {
            this.flush();
            return;
        }
        if (!this.timeoutSet) {
            this.timeoutSet = true;
            process.nextTick(this.flush);
        }
    }
    flush() {
        this.timeoutSet = false;
        const pipeline = this.connection.client.pipeline();
        for (const [recordName, { callback, action, version, data }] of this.writeBuffer.entries()) {
            switch (action) {
                case 'set':
                    if (this.pluginOptions.ttl) {
                        pipeline.setex(`${recordName}_v`, this.pluginOptions.ttl, version);
                        pipeline.setex(`${recordName}_d`, this.pluginOptions.ttl, JSON.stringify(data), callback);
                    }
                    else {
                        pipeline.mset({
                            [`${recordName}_v`]: version,
                            [`${recordName}_d`]: JSON.stringify(data)
                        }, callback);
                    }
                    break;
                case 'delete':
                    pipeline.del([`${recordName}_v`, `${recordName}_d`], callback);
                    break;
            }
        }
        this.writeBuffer.clear();
        for (const [recordName, callbacks] of this.readBuffer.entries()) {
            pipeline.mget([`${recordName}_v`, `${recordName}_d`], (error, result) => {
                if (typeof callbacks === 'function') {
                    this.readCallback(callbacks, error, result);
                }
                else {
                    callbacks.forEach((callback) => this.readCallback(callback, error, result));
                }
            });
        }
        this.readBuffer.clear();
        pipeline.exec();
    }
    readCallback(callback, error, result) {
        if (error) {
            callback(error.toString());
            return;
        }
        if (!result[0]) {
            callback(null, -1, null);
            return;
        }
        callback(null, Number(result[0]), JSON.parse(result[1]));
    }
}
exports.CacheConnector = CacheConnector;
exports.default = CacheConnector;
//# sourceMappingURL=connector.js.map