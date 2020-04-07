"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const connector_1 = require("../src/connector");
const connection_params_1 = require("./connection-params");
describe('the message connector has the correct structure', () => {
    let cacheConnector;
    before('creates the cacheConnector', async () => {
        // @ts-ignore
        cacheConnector = new connector_1.CacheConnector(connection_params_1.config, { logger: {
                // @ts-ignore
                getNameSpace: () => ({
                    fatal: (e, m) => {
                        // @ts-ignore
                        console.error('Fatal exception', e, m);
                    },
                    warn: () => { }
                })
            } }, {});
        await cacheConnector.whenReady();
    });
    it('implements the cache/storage connector interface', () => {
        chai_1.expect(typeof cacheConnector.description).to.equal('string');
        chai_1.expect(typeof cacheConnector.deleteBulk).to.equal('function');
        // expect(typeof cacheConnector.head).to.equal('function')
        chai_1.expect(typeof cacheConnector.get).to.equal('function');
        chai_1.expect(typeof cacheConnector.set).to.equal('function');
        chai_1.expect(typeof cacheConnector.delete).to.equal('function');
    });
    it('retrieves a non existing value', (done) => {
        cacheConnector.get('someValue', (error, version, value) => {
            chai_1.expect(error).to.equal(null);
            chai_1.expect(version).to.equal(-1);
            chai_1.expect(value).to.equal(null);
            done();
        });
    });
    it('sets a value', (done) => {
        cacheConnector.set('someValue', 2, { firstname: 'Wolfram' }, (error) => {
            chai_1.expect(error).to.equal(null);
            done();
        });
    });
    it('retrieves an existing value multiple times', (done) => {
        const results = [];
        const callback = (...args) => results.push(args);
        cacheConnector.get('someValue', callback);
        cacheConnector.get('someValue', callback);
        cacheConnector.get('someValue', callback);
        setTimeout(() => {
            chai_1.expect(results.length).to.equal(3);
            done();
        }, 60);
    });
    it('retrieves an existing value', (done) => {
        cacheConnector.get('someValue', (error, version, value) => {
            chai_1.expect(error).to.equal(null);
            chai_1.expect(version).to.equal(2);
            chai_1.expect(value).to.deep.equal({ firstname: 'Wolfram' });
            done();
        });
    });
    it('deletes a value', (done) => {
        cacheConnector.delete('someValue', (error) => {
            chai_1.expect(error).to.equal(null);
            done();
        });
    });
    it("Can't retrieve a deleted value", (done) => {
        cacheConnector.get('someValue', (error, version, value) => {
            chai_1.expect(error).to.equal(null);
            chai_1.expect(version).to.equal(-1);
            chai_1.expect(value).to.equal(null);
            done();
        });
    });
    it.skip('properly expires keys', (done) => {
        cacheConnector.set('willExpire', 1, { some: 'data' }, async (error) => {
            chai_1.expect(error).to.equal(null);
            await new Promise((resolve) => setTimeout(resolve, 2500));
            cacheConnector.get('willExpire', (err, version, value) => {
                chai_1.expect(err).to.equal(null);
                chai_1.expect(version).to.equal(-1);
                chai_1.expect(value).to.equal(null);
                done();
            });
        });
    }).timeout(5000);
    it('sets and gets ALOT of values (as object)', (done) => {
        const iterations = 30000;
        let setCount = 0;
        for (let i = 0; i < iterations; i++) {
            cacheConnector.set('someValue' + i, i, { value: i }, (error) => {
                chai_1.expect(error).to.equal(null);
                setCount++;
                if (setCount === iterations) {
                    let resultCount = 0;
                    for (let j = 0; j < iterations; j++) {
                        cacheConnector.get('someValue' + j, (getError, version, value) => {
                            chai_1.expect(getError).to.equal(null);
                            chai_1.expect(version).to.equal(j);
                            chai_1.expect(value).to.deep.equal({ value: j });
                            resultCount++;
                            if (resultCount === iterations) {
                                done();
                            }
                        });
                    }
                }
            });
        }
    }).timeout(10000);
    it('deletes in bulk', (done) => {
        const iterations = 30000;
        const recordNames = [];
        for (let i = 0; i < iterations; i++) {
            recordNames.push('someValue' + i);
        }
        cacheConnector.deleteBulk(recordNames, () => {
            let resultCount = 0;
            for (let j = 0; j < iterations; j++) {
                cacheConnector.get('someValue' + j, (getError, version, value) => {
                    chai_1.expect(getError).to.equal(null);
                    chai_1.expect(version).to.equal(-1);
                    chai_1.expect(value).to.equal(null);
                    resultCount++;
                    if (resultCount === iterations) {
                        done();
                    }
                });
            }
        });
    }).timeout(10000);
});
//# sourceMappingURL=cache-connector.spec.js.map