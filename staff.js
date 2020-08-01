"use strict";

const { getPostgresClient } = require('./postgres');

exports.staffData = [];

exports.loadStaffData = async function () {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM staff;`;

        await db.begin();
        const data = await db.execute(sql);
        exports.staffData = data;
        await db.commit();

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }
}
