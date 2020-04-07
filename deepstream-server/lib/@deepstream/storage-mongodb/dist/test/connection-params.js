"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = {
    connectionString: process.env.MONGODB_CONNECTION_STRING || 'mongodb://127.0.0.1',
    db: 'deepstream',
    defaultCollection: 'default',
    splitChar: '/'
};
//# sourceMappingURL=connection-params.js.map