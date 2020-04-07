"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rethinkdb = require("rethinkdb");
const events_1 = require("events");
class TableManager {
    constructor(connection, database) {
        this.connection = connection;
        this.database = database;
        this.tables = new Set();
        this.emitter = new events_1.EventEmitter();
        this.emitter.setMaxListeners(0);
    }
    /**
     * Creates the table if it doesn't exist yet
     */
    async createTable(table, primaryKey) {
        if (this.emitter.listeners(table).length === 0) {
            this.emitter.once(table, () => { });
            try {
                await rethinkdb
                    .db(this.database)
                    .tableCreate(table, { primary_key: primaryKey, durability: 'soft' })
                    .run(this.connection);
                await this.refreshTables();
                this.emitter.emit(table);
            }
            catch (e) {
                this.emitter.emit(table);
                if (this.isTableExistsError(e) === false) {
                    throw e;
                }
            }
            return;
        }
        return new Promise((resolve) => this.emitter.once(table, resolve));
    }
    /**
     * Checks if a specific table name exists. The list of tables is retrieved
     * on initialisation and can be updated at runtime using refreshTables
     */
    hasTable(table) {
        return this.tables.has(table);
    }
    /**
     * Called whenever the list of tables has gotten out of sync. E.g. after
     * receiving a "table exists"
     */
    async refreshTables() {
        const tables = await rethinkdb
            .db(this.database)
            .tableList()
            .run(this.connection);
        this.tables = new Set([...tables]);
    }
    /**
     * If tableCreate is called for an existing table, rethinkdb returns a
     * RqlRuntimeError. This error unfortunately doesn't come with a code or constant to check
     * its type, so this method tries to parse its error message instead
     */
    isTableExistsError(error) {
        return error.msg.indexOf('already exists') !== -1;
    }
}
exports.TableManager = TableManager;
//# sourceMappingURL=table-manager.js.map