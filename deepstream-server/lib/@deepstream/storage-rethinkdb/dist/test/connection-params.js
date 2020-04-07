"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = {
    host: process.env.RETHINKDB_HOST || 'localhost',
    port: 28015,
    primaryKey: 'own_primary_key',
    db: 'rethinkdb_db_test',
    defaultTable: 'default',
    splitChar: '/',
    storageKey: null,
    readOnly: false
};
//# sourceMappingURL=connection-params.js.map