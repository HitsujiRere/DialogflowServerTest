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

const omikujis = ['大吉', '中吉', '小吉', '吉'];
app.post('/dialogflow/omikuji', (req, res) => {
    const omikuji = omikujis[Math.floor(Math.random() * omikujis.length)];
    console.log(`omikuji=${omikuji}`);
    return res.json({
        omikuji: omikuji
    });
});

app.get('/', (req, res) => {
    res.render('hello.ejs');
});

app.listen((process.env.PORT || 8000), (req, res) => {
    console.log('Server is up and running...');
});
