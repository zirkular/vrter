"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const connector_1 = require("../src/connector");
const connection_params_1 = require("./connection-params");
const chai_1 = require("chai");
const rethinkdb = require("rethinkdb");
describe('it  distributes  records  between  multiple  tables', () => {
    let storageConnector;
    let conn;
    before(async () => {
        storageConnector = new connector_1.Connector(connection_params_1.config, { logger: { getNameSpace: () => ({
                    fatal: (e, m) => {
                        console.error('Fatal exception', e, m);
                    }
                })
            } });
        await storageConnector.whenReady();
        conn = storageConnector.connection;
        try {
            await rethinkdb.db(connection_params_1.config.db).tableDrop('dsTestA').run(conn);
            await rethinkdb.db(connection_params_1.config.db).tableDrop('dsTestB').run(conn);
            await rethinkdb.db(connection_params_1.config.db).tableDrop('dsTestDefault').run(conn);
        }
        catch (e) {
        }
        await storageConnector.tableManager.refreshTables();
    });
    // tslint:disable-next-line: no-unused-expression
    const tableNames = ['dsTestA', 'dsTestB'];
    for (let i = 0; i < tableNames.length; i++) {
        const tableName = tableNames[i];
        it(`sets  a  value  for  ${tableName}`, (done) => {
            storageConnector.set(`${tableName}/valueA`, 12, { isIn: tableName }, () => { done(); });
        });
        it(`has  created  ${tableName}`, async () => {
            const tableList = await rethinkdb.db(connection_params_1.config.db).tableList().run(conn);
            chai_1.expect(tableList.indexOf(tableName)).not.to.equal(-1);
        });
        it(`has  written  the  record  to  ${tableName}`, async () => {
            const record = await rethinkdb
                .table(tableName)
                .get('valueA')
                .run(conn);
            chai_1.expect(record).to.deep.equal({ __ds: { _v: 12 }, own_primary_key: 'valueA', isIn: tableName });
        });
        it(`creates  and  immediatly  updates  a  value  for  ${tableName}`, (done) => {
            let firstInsertionComplete = false;
            storageConnector.set(`${tableName}/someTest`, 2, { state: 'A' }, (error) => {
                chai_1.expect(firstInsertionComplete).to.equal(false);
                chai_1.expect(error).to.equal(null);
                firstInsertionComplete = true;
            });
            storageConnector.set(`${tableName}/someTest`, 3, { state: 'B' }, (error) => {
                chai_1.expect(firstInsertionComplete).to.equal(true);
                chai_1.expect(error).to.equal(null);
                storageConnector.get(`${tableName}/someTest`, (e, version, value) => {
                    chai_1.expect(e).to.equal(null);
                    chai_1.expect(value).to.deep.equal({ state: 'B' });
                    done();
                });
            });
        });
    }
});
//# sourceMappingURL=multi-table.spec.js.map