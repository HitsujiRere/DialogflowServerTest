'use strict';

const { getPostgresClient } = require('./postgres');

let staffData = [];
exports.staffData = staffData;

const loadStaffData = async () => {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM staff;`;

        await db.begin();
        staffData = await db.execute(sql);
        exports.staffData = staffData;
        await db.commit();

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }

    console.log('Loaded staffData!');
}
exports.loadStaffData = loadStaffData;
