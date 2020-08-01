'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const dialogflow = require('./dialogflow');
const staff = require('./staff');
const memo = require('./memo');
const daikichi = require('./daikichi');

const app = express();
app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 8000;

app.get('/', (req, res) => {
    res.render('hello.ejs');
});

app.post('/dialogflow', (req, res) => {
    const queryResult = req.body.queryResult;
    console.log('queryResult =');
    console.log(queryResult);

    let js = {
        'fulfillmentText': dialogflow.dialogflow(queryResult),
    };

    res.send(JSON.stringify(js));
});

app.get('/staff', (req, res) => {
    res.render('staff.ejs', {
        data: staff.staffData,
    });
});

app.get('/memo', (req, res) => {
    res.render('memo.ejs', {
        data: memo.memoData,
    });
});
app.post('/memo/send', async (req, res) => {
    const name = req.body.name;
    const title = req.body.title;
    const body = req.body.body;

    const result = await memo.pushMemoData(name, title, body)
        ? 'Correct!' : 'Failed...';

    res.render('page_return.ejs', {
        result: result,
        return_page: '/memo',
    });
});
app.get('/memo/load', async (req, res) => {
    memo.loadMemoData();
    res.render('page_return.ejs', {
        result: 'Correct!',
        return_page: '/memo',
    });
});

app.get('/daikichi', (req, res) => {
    res.render('daikichi.ejs', {
        data: daikichi.daikichiData,
    });
});
app.post('/daikichi/send', async (req, res) => {
    const message = req.body.message;

    const result = await daikichi.pushDaikichiData(message)
        ? 'Correct!' : 'Failed...';

    res.render('page_return.ejs', {
        result: result,
        return_page: '/daikichi',
    });
});
app.get('/daikichi/load', (req, res) => {
    daikichi.loadDaikichiData();
    res.render('page_return.ejs', {
        result: 'Correct!',
        return_page: '/daikichi',
    });
});

app.use(function (req, res, next) {
    res.status(404);
    res.render('err404.ejs');
});

app.use(function (err, req, res, next) {
    res.status(500);
    res.render('err500.ejs');
});

app.listen(PORT, async (req, res) => {
    console.log('Server is up!');
    staff.loadStaffData();
    memo.loadMemoData();
    daikichi.loadDaikichiData();
});
