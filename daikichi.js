"use strict";

const { getPostgresClient } = require('./postgres');

exports.daikichiData = [];

exports.loadDaikichiData = async function () {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM daikichi;`;

        await db.begin();
        const data = await db.execute(sql);
        exports.daikichiData = data;
        await db.commit();

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }
}

exports.pushDaikichiData = async function (message) {
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

    exports.loadDaikichiData();
    return correct;
}

function timeToString(timestamp) {
    const year = timestamp.getFullYear();
    const month = timestamp.getMonth() + 1;
    const date = timestamp.getDate();
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const seconds = timestamp.getSeconds();
    return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
}
