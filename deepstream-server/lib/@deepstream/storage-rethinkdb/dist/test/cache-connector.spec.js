"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const connector_1 = require("../src/connector");
const connection_params_1 = require("./connection-params");
describe('the storage connector has the correct structure', () => {
    let connector;
    before('creates the connector', async () => {
        connector = new connector_1.Connector(connection_params_1.config, { logger: { getNameSpace: () => ({
                    fatal: (e, m) => {
                        console.error('Fatal exception', e, m);
                    }
                })
            } });
        await connector.whenReady();
    });
    it('implements the cache/storage connector interface', () => {
        chai_1.expect(typeof connector.description).to.equal('string');
        chai_1.expect(typeof connector.deleteBulk).to.equal('function');
        // expect(typeof connector.head).to.equal('function')
        chai_1.expect(typeof connector.get).to.equal('function');
        chai_1.expect(typeof connector.set).to.equal('function');
        chai_1.expect(typeof connector.delete).to.equal('function');
    });
    it('retrieves a non existing value', (done) => {
        connector.get('someValue', (error, version, value) => {
            chai_1.expect(error).to.equal(null);
            chai_1.expect(version).to.equal(-1);
            chai_1.expect(value).to.equal(null);
            done();
        });
    });
    it('sets a value', (done) => {
        connector.set('someValue', 2, { firstname: 'Wolfram' }, (error) => {
            chai_1.expect(error).to.equal(null);
            done();
        });
    });
    it('retrieves an existing value', (done) => {
        connector.get('someValue', (error, version, value) => {
            chai_1.expect(error).to.equal(null);
            chai_1.expect(version).to.equal(2);
            chai_1.expect(value).to.deep.equal({ firstname: 'Wolfram' });
            done();
        });
    });
    it('deletes a value', (done) => {
        connector.delete('someValue', (error) => {
            chai_1.expect(error).to.equal(null);
            done();
        });
    });
    it("Can't retrieve a deleted value", (done) => {
        connector.get('someValue', (error, version, value) => {
            chai_1.expect(error).to.equal(null);
            chai_1.expect(version).to.equal(-1);
            chai_1.expect(value).to.equal(null);
            done();
        });
    });
});
//# sourceMappingURL=cache-connector.spec.js.map