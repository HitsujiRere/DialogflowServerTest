"use strict";

const { getPostgresClient } = require('./postgres');

exports.memoData = [];

exports.loadMemoData = async function () {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM memo;`;

        await db.begin();
        const data = await db.execute(sql);
        data.forEach((item) => {
            item.time = timeToString(item.time);
        });
        exports.memoData = data;
        await db.commit();

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }
}

exports.pushMemoData = async function (name, title, body) {
    let correct = false;
    const db = await getPostgresClient();
    try {
        const sql = `INSERT INTO memo (name,title,time,body) VALUES ($1, $2, now(), $3);`;
        const params = [name, title, body];

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

    exports.loadMemoData();
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
