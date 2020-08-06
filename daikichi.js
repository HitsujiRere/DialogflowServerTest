'use strict';

const { getPostgresClient } = require('./postgres');

let daikichiData = [];
exports.daikichiData = daikichiData;

const loadDaikichiData = async () => {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM daikichi;`;

        await db.begin();
        daikichiData = await db.execute(sql);
        exports.daikichiData = daikichiData;
        await db.commit();

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }

    console.log('Loaded daikichiData!');
}
exports.loadDaikichiData = loadDaikichiData;

const pushDaikichiData = async (message) => {
    let correct = false;
    const db = await getPostgresClient();
    try {
        const sql = `INSERT INTO daikichi ( message ) VALUES ( $1 );`;
        const params = [message];

        await db.begin();
        await db.execute(sql, params);
        await db.commit();
        correct = true;

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }

    loadDaikichiData();
    return correct;
}
exports.pushDaikichiData = pushDaikichiData;

const timeToString = (timestamp) => {
    const year = timestamp.getFullYear();
    const month = timestamp.getMonth() + 1;
    const date = timestamp.getDate();
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const seconds = timestamp.getSeconds();
    return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
}
