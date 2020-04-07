"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const connector_1 = require("../src/connector");
const connection_params_1 = require("./connection-params");
const rethinkdb = require("rethinkdb");
describe('is able to insert a larger number of values in quick succession', () => {
    let storageConnector;
    before(async () => {
        storageConnector = new connector_1.Connector(connection_params_1.config, { logger: { getNameSpace: () => ({
                    fatal: (e, m) => {
                        console.error('Fatal exception', e, m);
                    }
                })
            } });
        await storageConnector.whenReady();
    });
    after(async () => {
        await rethinkdb
            .db(connection_params_1.config.db)
            .tableDrop('quickInsertTestTable')
            .run(storageConnector.connection);
    });
    it('inserts 20 values in quick succession', (done) => {
        const expected = 20;
        let completed = 0;
        const callback = (err) => {
            completed++;
            chai_1.expect(err).to.equal(null);
            if (expected === completed) {
                done();
            }
        };
        chai_1.expect(() => {
            for (let i = 0; i <= expected; i++) {
                storageConnector.set('quickInsertTestTable/key' + i, i, {}, callback);
            }
        }).not.to.throw();
    });
});
//# sourceMappingURL=fast-insertion.spec.js.map