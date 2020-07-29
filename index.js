'use strict';

const express = require('express');
const bodyParser = require('body-parser');
//const http = require('http');
//const fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

const kujis = ['大吉', '中吉', '小吉', '吉'];
app.post('/dialogflow', (req, res) => {
    const queryResult = req.body.queryResult;
    console.log(queryResult);
    const displayName = queryResult.intent.displayName;
    let js = {};

    if (displayName === 'Omikuji') {
        const kuji = kujis[Math.floor(Math.random() * kujis.length)];
        console.log(`omikuji=${kuji}`);
        js = {
            'fulfillmentText': `${kuji}を引きました！`,
        };
    } else {
        js = {
            'fulfillmentText': `Node.jsから${queryResult.queryText}`,
        };
    }

    res.send(JSON.stringify(js));
});

app.get('/', (req, res) => {
    res.render('hello.ejs');
});

app.listen((process.env.PORT || 8000), (req, res) => {
    console.log('Server is up and running...');
});
