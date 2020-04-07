"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pkg = require("../package.json");
const redis_connection_1 = require("./redis-connection");
const all_1 = require("@deepstream/protobuf/dist/types/all");
const types_1 = require("@deepstream/types");
class RedisClusterNode extends types_1.DeepstreamPlugin {
    constructor(pluginConfig, services, config) {
        super();
        this.services = services;
        this.config = config;
        this.description = `Redis Cluster Node Version: ${pkg.version}`;
        this.callbacks = new Map();
        this.connection = new redis_connection_1.RedisConnection(pluginConfig, this.services.logger);
        this.subscribeConnection = new redis_connection_1.RedisConnection(pluginConfig, this.services.logger);
        this.subscribeConnection.client.on('message', this.onMessage.bind(this));
    }
    async whenReady() {
        await this.connection.whenReady();
    }
    async close() {
        await this.connection.close();
    }
    sendDirect(toServer, message) {
        this.connection.client.publish(message.topic.toString(), JSON.stringify({ fromServer: this.config.serverName, toServer, message }), () => { });
    }
    send(message) {
        this.connection.client.publish(message.topic.toString(), JSON.stringify({ fromServer: this.config.serverName, message }), () => { });
    }
    subscribe(topic, callback) {
        this.services.logger.debug("INFO" /* INFO */, `new subscription to topic ${all_1.TOPIC[topic] || all_1.STATE_REGISTRY_TOPIC[topic]}`);
        let callbacks = this.callbacks.get(topic);
        if (!callbacks) {
            callbacks = new Set();
            this.callbacks.set(topic, callbacks);
            this.subscribeConnection.client.subscribe(topic.toString());
        }
        callbacks.add(callback);
    }
    onMessage(topic, clusterMessage) {
        try {
            const { fromServer, toServer, message } = JSON.parse(clusterMessage);
            if (this.config.serverName === fromServer) {
                return;
            }
            if (toServer !== undefined && this.config.serverName !== toServer) {
                return;
            }
            const callbacks = this.callbacks.get(message.topic);
            if (!callbacks || callbacks.size === 0) {
                this.services.logger.error("PLUGIN_ERROR" /* PLUGIN_ERROR */, `Received message for unknown topic ${message.topic}`);
                return;
            }
            callbacks.forEach((callback) => callback(message, fromServer));
        }
        catch (e) {
            this.services.logger.error("PLUGIN_ERROR" /* PLUGIN_ERROR */, `Error parsing message ${e.toString()}`);
            return;
        }
    }
}
exports.default = RedisClusterNode;
//# sourceMappingURL=redis-cluster-node.js.map