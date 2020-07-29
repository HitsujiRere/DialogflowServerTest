"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const { getPostgresClient } = require('./postgres');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());

const PORT = process.env.PORT || 8000;

let staffData = [];

async function loadStaffData() {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM staff;`;
        //const params = ['1', 'name'];

        await db.begin();
        const data = await db.execute(sql);
        console.log(data);
        staffData = data;
        await db.commit();

    } catch (e) {
        await db.rollback();
        throw e;
    } finally {
        await db.release();
    }
}

app.get("/staff", async (req, res) => {
    res.render('staff.ejs', {
        data: staffData,
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
    } else {
        js = {
            "fulfillmentText": `Node.jsから「${queryResult.queryText}」`,
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
});

const kujis = ["大吉", "中吉", "小吉", "吉"];
function omikuji() {
    const kuji = kujis[Math.floor(Math.random() * kujis.length)];
    return kuji;
}
