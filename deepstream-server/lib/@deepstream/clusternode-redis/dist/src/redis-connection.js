"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Redis = require("ioredis");
const ioredis_1 = require("ioredis");
const events_1 = require("events");
const url = require("url");
class RedisConnection {
    constructor(options, logger) {
        this.logger = logger;
        this.isReady = false;
        this.emitter = new events_1.EventEmitter();
        this.validateOptions(options);
        if (options.url) {
            const REDIS_URL = url.parse(options.url);
            options.host = REDIS_URL.hostname;
            options.port = REDIS_URL.port;
        }
        if (options.nodes instanceof Array) {
            const nodes = options.nodes;
            delete options.nodes;
            this.client = new ioredis_1.Cluster(nodes, options);
        }
        else {
            this.client = new Redis(options);
        }
        this.client.on('ready', this.onReady.bind(this));
        this.client.on('error', this.onError.bind(this));
        this.client.on('end', this.onDisconnect.bind(this));
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
    onReady() {
        this.isReady = true;
        this.emitter.emit('ready');
    }
    onError(error) {
        this.logger.fatal('REDIS_CONNECTION_ERROR', `REDIS error: ${error}`);
    }
    onDisconnect(error) {
        this.onError('disconnected');
    }
    validateOptions(options) {
        if (!options) {
            this.logger.fatal("PLUGIN_INITIALIZATION_ERROR" /* PLUGIN_INITIALIZATION_ERROR */, "Missing option 'host' for redis-connector");
        }
        if (options.nodes && !(options.nodes instanceof Array)) {
            this.logger.fatal("PLUGIN_INITIALIZATION_ERROR" /* PLUGIN_INITIALIZATION_ERROR */, 'Option nodes must be an array of connection parameters for cluster');
        }
    }
}
exports.RedisConnection = RedisConnection;
//# sourceMappingURL=redis-connection.js.map