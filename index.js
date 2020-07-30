"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const { getPostgresClient } = require('./postgres');
//require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 8000;

let staffData = [];
let memoData = [];

async function loadStaffData() {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM staff;`;
        //const params = ['1', 'name'];

        await db.begin();
        const data = await db.execute(sql);
        //console.log(data);
        staffData = data;
        await db.commit();

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }
}

async function loadMemoData() {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM memo;`;
        //const params = ['1', 'name'];

        await db.begin();
        const data = await db.execute(sql);
        data.forEach((item) => {
            item.time = timeToString(item.time);
        });
        //console.log(data);
        memoData = data;
        await db.commit();

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }
}

async function pushMemoData(name, title, body) {
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

app.get("/staff", (req, res) => {
    res.render('staff.ejs', {
        data: staffData,
    });
});

app.get("/memo", (req, res) => {
    res.render('memo.ejs', {
        data: memoData,
    });
});

app.get("/memo/load", (req, res) => {
    loadMemoData();
    res.render('memo_send.ejs', {
        result: "Correct!",
    });
});

app.post("/memo/send", async (req, res) => {
    const name = req.body.name;
    const title = req.body.title;
    const body = req.body.body;

    const result = pushMemoData(name, title, body) ? "Correct!" : "Failed...";

    res.render('memo_send.ejs', {
        result: result,
    });
});

app.post("/dialogflow", (req, res) => {
    const queryResult = req.body.queryResult;
    console.log("queryResult =");
    console.log(queryResult);
    const displayName = queryResult.intent.displayName;
    let js = {};

    if (displayName === "Omikuji") {
        const kuji = omikuji();
        console.log(`omikuji = ${kuji}`);
        js = {
            "fulfillmentText": `${kuji}を引きました！`,
            "kuji": kuji
        };
    } else if (displayName === "PushMemo") {
        const name = 'dialogflow';
        const date = queryResult.parameters['date'];
        const time = queryResult.parameters['time'];
        const doing = queryResult.parameters['memodoing'];
        const title = `${doing} : ${date} ${time}`;
        const body = `${doing} : ${date} ${time}`;

        const result = pushMemoData(name, title, body) ? "Correct!" : "Failed...";
        js = {
            "fulfillmentText": `Memoに「${body}」と書き込みました`,
        };
    } else {
        js = {
            "fulfillmentText": `Node.jsから「${queryResult.queryText} 」`,
        };
    }

    res.send(JSON.stringify(js));
});

app.get("/", (req, res) => {
    res.render("hello.ejs");
});

app.listen(PORT, async (req, res) => {
    console.log("Server is up and running...");
    loadStaffData();
    loadMemoData();
});

const kujis = ["大吉", "中吉", "小吉", "吉"];
function omikuji() {
    const kuji = kujis[Math.floor(Math.random() * kujis.length)];
    return kuji;
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
