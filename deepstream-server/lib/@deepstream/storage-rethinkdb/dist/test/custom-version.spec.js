"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const connector_1 = require("../src/connector");
const connection_params_1 = require("./connection-params");
const rethinkdb = require("rethinkdb");
describe('the storage connector uses a custom version key', () => {
    let connector;
    let connection;
    before('creates the connector', async () => {
        connector = new connector_1.Connector({ ...connection_params_1.config, versionKey: '__v' }, { logger: { getNameSpace: () => ({
                    fatal: (e, m) => {
                        console.error('Fatal exception', e, m);
                    }
                })
            } });
        await connector.whenReady();
        connection = connector.connection;
    });
    it('sets a value', (done) => {
        connector.set('someValueWithCustomVersion', 2, { firstname: 'Wolfram' }, (error) => {
            chai_1.expect(error).to.equal(null);
            rethinkdb
                .table(connection_params_1.config.defaultTable)
                .get('someValueWithCustomVersion')
                .run(connection)
                .then((result) => {
                chai_1.expect(result).to.deep.equal({ __v: 2, firstname: 'Wolfram', own_primary_key: 'someValueWithCustomVersion' });
            })
                .then(() => done());
        });
    });
    it('retrieves an existing value', (done) => {
        connector.get('someValueWithCustomVersion', (error, version, value) => {
            chai_1.expect(error).to.equal(null);
            chai_1.expect(version).to.equal(2);
            chai_1.expect(value).to.deep.equal({ __v: 2, firstname: 'Wolfram' });
            done();
        });
    });
});
//# sourceMappingURL=custom-version.spec.js.map