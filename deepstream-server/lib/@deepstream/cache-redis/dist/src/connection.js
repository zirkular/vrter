"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Redis = require("ioredis");
const ioredis_1 = require("ioredis");
const events_1 = require("events");
const url = require("url");
/**
 * Generic connection to Redis. Can be extended or
 * instantiated.
 *
 * @param {Object} options A map of connection parameters
 * To connect to a single redis node you can use:
 *
 * {
 *    host: <String>
 *    port: <Number>
 *    [serverName]: <String> //optional
 *    [password]: <String> //optional
 *    [db]: <Integer> //optional
 *    ttl: <Integer> //optional
 * }
 *
 * To connect to a cluster you can use:
 *
 * {
 *    nodes: [
 *      // Use password "password-for-30001" for 30001
 *      { port: <Number>, password: <String> },
 *      // Don't use password when accessing 30002
 *      { port: <Number>, password: null }
 *      // Other nodes will use "fallback-password"
 *    ],
 *    redisOptions: {
 *      password: 'fallback-password'
 *    }
 * }
 *
 * For more details and options see https://github.com/luin/ioredis
 * @constructor
 */
class Connection {
    constructor(options, logger) {
        this.logger = logger;
        this.isReady = false;
        this.emitter = new events_1.EventEmitter();
        this._validateOptions(options);
        // See https://github.com/luin/ioredis/wiki/Improve-Performance
        if (options.url) {
            const REDIS_URL = url.parse(options.url);
            options.host = REDIS_URL.hostname;
            options.port = REDIS_URL.port;
        }
        if (options.nodes instanceof Array) {
            options.redisOptions.dropBufferSupport = true;
            const nodes = options.nodes;
            delete options.nodes;
            this.client = new ioredis_1.Cluster(nodes, options);
        }
        else {
            options.dropBufferSupport = true;
            this.client = new Redis(options);
        }
        this.client.on('ready', this._onReady.bind(this));
        this.client.on('error', this._onError.bind(this));
        this.client.on('end', this._onDisconnect.bind(this));
    }
    whenReady() {
        if (!this.isReady) {
            return new Promise((resolve) => this.emitter.once('ready', resolve));
        }
    }
    close() {
        return new Promise((resolve) => {
            this.client.removeAllListeners('end');
            this.client.once('end', resolve);
            this.client.quit();
        });
    }
    /**
     * Callback for authentication responses
     */
    _onAuthResult(error) {
        if (error) {
            this._onError('Failed to authenticate connection: ' + error.toString());
        }
    }
    /**
     * Callback for established connections
     */
    _onReady() {
        this.isReady = true;
        this.emitter.emit('ready');
    }
    /**
     * Generic error callback
     */
    _onError(error) {
        this.logger.fatal('REDIS_CONNECTION_ERROR', `REDIS error: ${error}`);
    }
    /**
     * Callback for disconnection events
     */
    _onDisconnect(error) {
        this._onError('disconnected');
    }
    /**
     * Checks if all required parameters are present
     */
    _validateOptions(options) {
        if (!options) {
            this.logger.fatal('PLUGIN_INITIALIZATION_ERROR', "Missing option 'host' for redis-connector");
        }
        if (options.nodes && !(options.nodes instanceof Array)) {
            this.logger.fatal('PLUGIN_INITIALIZATION_ERROR', 'Option nodes must be an array of connection parameters for cluster');
        }
    }
}
exports.Connection = Connection;
//# sourceMappingURL=connection.js.map