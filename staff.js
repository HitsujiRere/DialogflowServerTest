'use strict';

const { getPostgresClient } = require('./postgres');

exports.staffData = [];

exports.loadStaffData = async function () {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM staff;`;

        await db.begin();
        exports.staffData = await db.execute(sql);
        await db.commit();

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }

    console.log('Loaded staffData!');
}
