"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rethinkdb = require("rethinkdb");
const table_manager_1 = require("./table-manager");
const crypto = require("crypto");
const package_json_1 = require("../package.json");
const events_1 = require("events");
const types_1 = require("@deepstream/types");
class Connector extends types_1.DeepstreamPlugin {
    /**
     * Connects deepstream to a rethinkdb. RethinksDB is a great fit for deepstream due to its realtime capabilities.
     *
     * Similar to other storage connectors (e.g. MongoDB), this connector supports saving records to multiple tables.
     * In order to do this, specify a splitChar, e.g. '/' and use it in your record names. Naming your record
     *
     * user/i4vcg5j1-16n1qrnziuog
     *
     * for instance will create a user table and store it in it. This will allow for more sophisticated queries as
     * well as speed up read operations since there are less entries to look through
     *
     * @param {Object} options rethinkdb driver options. See rethinkdb.com/api/javascript/#connect
     *
     * e.g.
     *
     * {
     *     host: 'localhost',
     *     port: 28015,
     *     authKey: 'someString'
     *     database: 'deepstream',
     *     defaultTable: 'deepstream_records',
     *     splitChar: '/'
     * }
     *
     * Please note the three additional, optional keys:
     *
     * database   specifies which database to use. Defaults to 'deepstream'
     * defaultTable specifies which table records will be stored in that don't specify a table. Defaults to deepstream_records
     * splitChar   specifies a character that separates the record's id from the table it should be stored in. defaults to null
     */
    constructor(options, services) {
        super();
        this.options = options;
        this.services = services;
        this.apiVersion = 2;
        this.description = `Rethinkdb Storage Connector ${package_json_1.version}`;
        this.defaultTable = this.options.defaultTable || 'deepstream_records';
        this.splitChar = this.options.splitChar || null;
        this.primaryKey = this.options.primaryKey || 'ds_id';
        this.emitter = new events_1.EventEmitter();
        this.isReady = false;
        this.logger = this.services.logger.getNameSpace('RETHINDB');
        this.checkOptions(options);
        this.tableMatch = this.splitChar
            ? new RegExp('^(\\w+)' + this.escapeRegExp(this.splitChar))
            : null;
        options.db = options.db || 'deepstream';
        this.connect();
    }
    async connect() {
        try {
            this.connection = await rethinkdb.connect(this.options);
            const dbList = await rethinkdb.dbList().run(this.connection);
            if (!dbList.includes(this.options.db)) {
                await rethinkdb.dbCreate(this.options.db).run(this.connection);
            }
            this.connection.use(this.options.db);
            this.tableManager = new table_manager_1.TableManager(this.connection, this.options.db);
            await this.tableManager.refreshTables();
            this.isReady = true;
            this.emitter.emit('ready');
        }
        catch (error) {
            this.logger.fatal('CONNECTION_ERROR', error.toString());
        }
    }
    async whenReady() {
        if (!this.isReady) {
            return new Promise(resolve => this.emitter.once('ready', resolve));
        }
    }
    async close() {
        await this.connection.close();
    }
    /**
     * Writes a value to the database. If the specified table doesn't exist yet, it will be created
     * before the write is excecuted. If a table creation is already in progress, create table will
     * only add the method to its array of callbacks
     */
    set(recordName, version, data, callback) {
        if (this.options.readOnly) {
            this.logger.error("ERROR" /* ERROR */, 'Rethinkdb running in read-only mode, yet set was called');
        }
        const params = this.getParams(recordName);
        if (this.tableManager.hasTable(params.table)) {
            this.insert(params, version, data, callback);
        }
        else {
            this.tableManager.createTable(params.table, this.primaryKey)
                .then(() => {
                this.insert(params, version, data, callback);
            });
        }
    }
    /**
     * Retrieves a value from the cache
     */
    get(key, callback) {
        const params = this.getParams(key);
        if (this.tableManager.hasTable(params.table)) {
            rethinkdb
                .table(params.table)
                .get(params.id)
                .run(this.connection, (error, entry) => {
                if (error) {
                    callback(error.toString());
                    return;
                }
                if (!entry) {
                    callback(null, -1, null);
                    return;
                }
                let version;
                if (this.options.versionKey) {
                    version = entry[this.options.versionKey];
                }
                else {
                    version = entry.__ds._v;
                }
                delete entry[this.primaryKey];
                delete entry.__ds; // in case is set
                if (entry.__dsList) {
                    callback(null, version, entry.__dsList);
                }
                else {
                    callback(null, version, entry);
                }
            });
        }
        else {
            callback(null, -1, null);
        }
    }
    /**
     * Deletes an entry from the cache.
     */
    delete(key, callback) {
        if (this.options.readOnly) {
            this.logger.error("ERROR" /* ERROR */, 'Rethinkdb running in read-only mode, yet set was called');
        }
        const params = this.getParams(key);
        if (this.tableManager.hasTable(params.table)) {
            rethinkdb
                .table(params.table)
                .get(params.id)
                .delete()
                .run(this.connection, callback);
        }
        else {
            callback(`Table '${params.table}' does not exist`);
        }
    }
    deleteBulk(recordNames, callback) {
        throw new Error('Delete bulk only required in cache');
    }
    /**
     * Parses the provided record name and returns an object
     * containing a table name and a record name
     */
    getParams(recordName) {
        const table = this.tableMatch ? recordName.match(this.tableMatch) : recordName;
        const params = { table: this.defaultTable, id: recordName };
        if (table) {
            params.table = table[1];
            params.id = recordName.substr(table[1].length + 1);
        }
        // rethink can't have a key > 127 bytes; hash key and store alongside
        if (params.id.length > 127) {
            params.fullKey = params.id;
            params.id = crypto.createHash('sha256').update(params.id).digest('hex');
        }
        return params;
    }
    /**
     * Augments a value with a primary key and writes it to the database
     */
    insert(params, version, data, callback) {
        let value;
        if (data instanceof Array) {
            if (this.options.versionKey) {
                value = { __dsList: data, [this.options.versionKey]: version, [this.primaryKey]: params.id };
            }
            else {
                value = { __dsList: data, __ds: { _v: version }, [this.primaryKey]: params.id };
            }
        }
        else {
            if (this.options.versionKey) {
                value = { ...data, [this.options.versionKey]: version, [this.primaryKey]: params.id };
            }
            else {
                value = { ...data, __ds: { _v: version }, [this.primaryKey]: params.id };
            }
        }
        if (params.fullKey) {
            value.__ds.fullKey = params.fullKey;
        }
        rethinkdb
            .table(params.table)
            .insert(value, { returnChanges: false, conflict: 'replace' })
            .run(this.connection, callback);
    }
    /**
     * Makes sure that the options object contains all mandatory
     * settings
     */
    checkOptions(options) {
        if (typeof options.host !== 'string') {
            throw new Error('Missing option host');
        }
        if (isNaN(options.port)) {
            throw new Error('Missing option port');
        }
    }
    /**
     * Escapes user input for use in a regular expression
     */
    escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
}
exports.Connector = Connector;
exports.default = Connector;
//# sourceMappingURL=connector.js.map