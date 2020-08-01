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
let daikichiData = [];

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

async function loadDaikichiData() {
    const db = await getPostgresClient();
    try {
        const sql = `SELECT * FROM daikichi;`;
        //const params = ['1', 'name'];

        await db.begin();
        const data = await db.execute(sql);
        daikichiData = data;
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

async function pushDaikichiData(message) {
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

app.post("/memo/send", async (req, res) => {
    const name = req.body.name;
    const title = req.body.title;
    const body = req.body.body;

    const result = pushMemoData(name, title, body) ? "Correct!" : "Failed...";

    res.render('page_return.ejs', {
        result: result,
        return_page: '/memo',
    });
});

app.get("/memo/load", (req, res) => {
    loadMemoData();
    res.render('page_return.ejs', {
        result: "Correct!",
        return_page: '/memo',
    });
});

app.get("/daikichi", (req, res) => {
    res.render('daikichi.ejs', {
        data: daikichiData,
    });
});

app.post("/daikichi/send", async (req, res) => {
    const message = req.body.message;

    const result = pushDaikichiData(message) ? "Correct!" : "Failed...";

    res.render('page_return.ejs', {
        result: result,
        return_page: '/daikichi',
    });
});

app.get("/daikichi/load", (req, res) => {
    loadDaikichiData();
    res.render('page_return.ejs', {
        result: "Correct!",
        return_page: '/daikichi',
    });
});

app.post("/dialogflow", (req, res) => {
    const queryResult = req.body.queryResult;
    console.log("queryResult =");
    console.log(queryResult);
    const displayName = queryResult.intent.displayName;
    let js = {};

    switch (displayName) {
        case "Game":
            const gameName = queryResult.parameters.game;

            switch (gameName) {
                case 'おみくじ':
                    const kuji = omikuji();
                    js = {
                        "fulfillmentText": `${kuji}を引きました！`,
                    };
                    break;
            }
            if (gameName === 'おみくじ') {
                const kuji = omikuji();
                js = {
                    "fulfillmentText": `${kuji}を引きました！`,
                };
            } else if (gameName === 'じゃんけん') {
                const hand = janken();
                js = {
                    "fulfillmentText": `${hand}！`,
                };
            } else if (gameName === '占い') {
                const result = uranai();
                js = {
                    "fulfillmentText": `${result}`,
                };
            } else {
                js = {
                    "fulfillmentText": `なんのゲームか分かりませんでした...`,
                };
            }
            break;

        case "PushMemo":
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
            break;

        case "Daikichi":
            const daikichi = daikichiData[Math.floor(Math.random() * daikichiData.length)];
            js = {
                "fulfillmentText": daikichi.message,
                "daikichi_id": daikichi.id,
            };
            break;

        default:
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

const jankenHands = ["ぐー", "ちょき", "ぱー"];
function janken() {
    const hand = jankenHands[Math.floor(Math.random() * jankenHands.length)];
    return hand;
}

const uranaiResult = ["1", "2", "3", "4"];
function uranai() {
    const res = uranaiResult[Math.floor(Math.random() * uranaiResult.length)];
    return res;
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
