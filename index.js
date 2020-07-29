"use strict";

const express = require("express");
const bodyParser = require("body-parser");
//const http = require('http');
//const fs = require('fs');
const { Client } = require('pg');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());

const client = new Client({
    host: process.env.ENV_HOST,
    databese: process.env.ENV_DB,
    user: process.env.ENV_USER,
    port: 5432,
    password: process.env.ENV_PASSWORD,
    ssl: { rejectUnauthorized: false }
});

client.connect()
    .then(() => console.log("Connected successfuly"))
    .then(() => client.query("select * from staff;"))
    .then(results => console.table(results.rows))
    .catch((e => console.log(e)))
    .finally((() => client.end()))

const PORT = process.env.PORT || 8000;

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

app.listen(PORT, (req, res) => {
    console.log("Server is up and running...");
});

const kujis = ["大吉", "中吉", "小吉", "吉"];
function omikuji() {
    const kuji = kujis[Math.floor(Math.random() * kujis.length)];
    return kuji;
}
