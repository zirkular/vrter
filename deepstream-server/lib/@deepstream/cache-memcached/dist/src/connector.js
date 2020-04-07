"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Memcached = require("memcached");
const pkg = require("../package.json");
const types_1 = require("@deepstream/types");
/**
 * This class connects deepstream.io to a memcached cache, using the
 * memcached library (https://www.npmjs.com/package/memcached).
 *
 * Please consult https://www.npmjs.com/package/memcached for details
 * on the serverLocation and memcachedOptions setting
 *
 * lifetime is the default lifetime for objects in seconds (defaults to 1000)
 */
class CacheConnector extends types_1.DeepstreamPlugin {
    constructor(options, services, deepstreamConfig) {
        super();
        this.options = options;
        this.services = services;
        this.description = `Memcached ${pkg.version}`;
        this.logger = this.services.logger.getNameSpace('MEMCACHED_CACHE');
        this.options.lifetime = options.lifetime || 60000;
        if (!this.options.serverLocation) {
            this.logger.fatal("PLUGIN_INITIALIZATION_ERROR" /* PLUGIN_INITIALIZATION_ERROR */, "Missing parameter 'serverLocation' for memcached connector");
        }
    }
    async whenReady() {
        this.client = new Memcached(this.options.serverLocation, this.options.memcachedOptions || {});
        this.client.on('failure', () => this.logger.fatal("ERROR" /* ERROR */, 'Memcached error'));
    }
    head(recordName, callback) {
        this.client.get(recordName, (err, value) => {
            if (err) {
                callback(err);
                return;
            }
            if (value === undefined) {
                callback(null, -1);
                return;
            }
            callback(null, value.version);
        });
    }
    headBulk(recordNames, callback) {
        this.client.getMulti(recordNames, (err, values) => {
            if (err) {
                callback(err);
                return;
            }
            callback(null, recordNames.reduce((result, name) => {
                result[name] = values[name] ? values[name].version : -1;
                return result;
            }, {}));
        });
    }
    set(recordName, version, data, callback, metaData) {
        this.client.set(recordName, { version, data }, this.options.lifetime, (err) => callback(err ? err : null));
    }
    get(recordName, callback, metaData) {
        this.client.get(recordName, (err, value) => {
            if (err) {
                callback(err);
                return;
            }
            if (value === undefined) {
                callback(null, -1, null);
                return;
            }
            callback(null, value.version, value.data);
        });
    }
    delete(recordName, callback, metaData) {
        this.client.del(recordName, (err) => callback(err ? err : null));
    }
    deleteBulk(recordNames, callback, metaData) {
        const promises = recordNames.map((name) => new Promise((resolve, reject) => {
            this.client.del(name, (err) => err ? reject(err) : resolve());
        }));
        Promise
            .all(promises)
            .then(() => callback(null))
            .catch((e) => callback(e));
    }
}
exports.CacheConnector = CacheConnector;
exports.default = CacheConnector;
//# sourceMappingURL=connector.js.map