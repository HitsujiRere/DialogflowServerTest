'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const DialoglowUseAPI = require('./dialogflowUseAPI');
const dialogflowResponse = require('./dialogflowResponse');
const dialogflowVoiceUse = require('./dialogflowVoiceUse');
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

app.get('/', async (req, res) => {
    res.render('hello.ejs');
});

app.post('/dialogflow', async (req, res) => {
    const queryResult = req.body.queryResult;
    console.log('queryResult =');
    console.log(queryResult);

    let js = {
        'fulfillmentText': dialogflowResponse.dialogflowResponse(queryResult),
    };

    res.send(JSON.stringify(js));
});

app.get('/staff', async (req, res) => {
    res.render('staff.ejs', {
        data: staff.staffData,
    });
});

app.get('/memo', async (req, res) => {
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

app.get('/daikichi', async (req, res) => {
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
app.get('/daikichi/load', async (req, res) => {
    daikichi.loadDaikichiData();
    res.render('page_return.ejs', {
        result: 'Correct!',
        return_page: '/daikichi',
    });
});

app.get('/webdemo', async (req, res) => {
    res.render('webdemo.ejs');
});

app.get('/dialogflow', async (req, res) => {
    res.render('dialogflow.ejs');
});
app.get('/dialogflow_talk', async (req, res) => {
    res.render('dialogflow_talk.ejs');
});
app.post('/dialogflow/send', async (req, res) => {
    res.status(200);

    const query = req.body.message;

    const fulfillmentText = await DialoglowUseAPI.executeQuery(query);

    console.log(fulfillmentText);

    res.send(fulfillmentText);
});

app.get('/dialogflow_voice', async (req, res) => {
    res.render('dialogflow_voice.ejs');
});

app.use(async (req, res, next) => {
    res.status(404);
    res.render('err404.ejs');
});

app.use(async (err, req, res, next) => {
    res.status(500);
    res.render('err500.ejs');
    console.log(err);
});

app.listen(PORT, async (req, res) => {
    console.log('Server is up!');
    staff.loadStaffData();
    memo.loadMemoData();
    daikichi.loadDaikichiData();
    DialoglowUseAPI.makeKeyJsonFile();
});
