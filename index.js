'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const API_KEY = require('./apiKey');

var fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.post('/dialogflow', (req, res) => {
});

app.get('/', (req, res) => {
    res.render('hello.ejs');
});

app.listen((process.env.PORT || 8000), (req, res) => {
    console.log('Server is running...');
});
