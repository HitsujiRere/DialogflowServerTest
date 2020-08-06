'use strict';

const { getPostgresClient } = require('./postgres');

let memoData = [];
exports.memoData = memoData;

const loadMemoData = async () => {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM memo;`;

        await db.begin();
        memoData = await db.execute(sql);
        memoData.forEach((item) => {
            item.time = timeToString(item.time);
        });
        exports.memoData = memoData;
        await db.commit();

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }

    console.log('Loaded memoData!');
}
exports.loadMemoData = loadMemoData;

const pushMemoData = async (name, title, body) => {
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

    loadMemoData();
    return correct;
}
exports.pushMemoData = pushMemoData;

const timeToString = (timestamp) => {
    const year = timestamp.getFullYear();
    const month = timestamp.getMonth() + 1;
    const date = timestamp.getDate();
    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const seconds = timestamp.getSeconds();
    return `${year}/${month}/${date} ${hours}:${minutes}:${seconds}`;
}
