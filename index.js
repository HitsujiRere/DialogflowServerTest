'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const http = require('http').createServer(app);
const io = require('socket.io').listen(http);
const cron = require('node-cron');
const ss = require('socket.io-stream');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { Transform, pipeline } = require('stream');
const uuid = require('uuid');
const util = require('util');
const pump = util.promisify(pipeline);
const VoiceText = require('./voicetext');

const DialoglowUseAPI = require('./dialogflowUseAPI');
const dialogflowResponse = require('./dialogflowResponse');
const dialogflowVoiceUse = require('./dialogflowVoiceUse');
const dialogflowVoiceStream = require('./dialogflowVoiceStream');
const staff = require('./staff');
const memo = require('./memo');
const daikichi = require('./daikichi');

app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());
app.use(express.static('public'));

const upload = multer({ dest: './uploads/' });

const voicetext = new VoiceText(process.env.VOICE_TEXT_API_KEY);

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
app.post('/dialogflow_voice/send', upload.any(), async (req, res, next) => {
    console.log(req.files);
    res.status(200).end();
});

app.get('/dialogflow_stream', async (req, res) => {
    res.render('dialogflow_stream.ejs');
});
io.on('connect', (client) => {
    console.log(`Client connected [id=${client.id}]`);
    client.emit('server_setup', `Server connected [id=${client.id}]`);

    // when the client sends 'message' events
    // when using simple audio input
    client.on('message', async (data) => {
        console.log('message');
        // we get the dataURL which was sent from the client
        const dataURL = data.audio.dataURL.split(',').pop();
        // we will convert it to a Buffer
        let fileBuffer = Buffer.from(dataURL, 'base64');
        // run the simple detectIntent() function
        const results = await detectIntent(fileBuffer);
        client.emit('results', results);
    });

    // when the client sends 'message' events
    // when using simple audio input
    client.on('message-transcribe', async (data) => {
        console.log('message-transcribe');
        // we get the dataURL which was sent from the client
        const dataURL = data.audio.dataURL.split(',').pop();
        // we will convert it to a Buffer
        let fileBuffer = Buffer.from(dataURL, 'base64');
        // run the simple transcribeAudio() function
        const results = await transcribeAudio(fileBuffer);
        client.emit('results', results);
    });

    // when the client sends 'stream' events
    // when using audio streaming
    ss(client).on('stream', (stream, data) => {
        console.log('stream');
        // get the name of the stream
        const filename = path.basename(data.name);
        // pipe the filename to the stream
        stream.pipe(fs.createWriteStream(filename));
        // make a detectIntStream call
        detectIntentStream(stream, (results) => {
            console.log(results);
            client.emit('results', results);
        });
    });

    // when the client sends 'stream-transcribe' events
    // when using audio streaming
    ss(client).on('stream-transcribe', (stream, data) => {
        console.log('stream-transcribe');
        // get the name of the stream
        const filename = path.basename(data.name);
        // pipe the filename to the stream
        stream.pipe(fs.createWriteStream(filename));
        // make a detectIntStream call
        transcribeAudioStream(stream, (results) => {
            console.log(results);
            client.emit('results', results);
        });
    });

    // when the client sends 'tts' events
    ss(client).on('tts', (text) => {
        console.log('tts');
        textToAudioBuffer(text).then((results) => {
            console.log(results);
            client.emit('results', results);
        }).catch((e) => {
            console.log(e);
        });
    });

    // when the client sends 'stream-media' events
    // when using audio streaming
    ss(client).on('stream-media', (stream, data) => {
        console.log('stream-media');
        // get the name of the stream
        const filename = path.basename(data.name);
        // pipe the filename to the stream
        stream.pipe(fs.createWriteStream(filename));
        // make a detectIntStream call
        transcribeAudioMediaStream(stream, (results) => {
            console.log(results);
            client.emit('results', results);
        });
    });
});

app.get('/dialogflow_talkAuto', async (req, res) => {
    res.render('dialogflow_talkAuto.ejs');
});
app.post('/dialogflow_talkAuto/voice', (req, res) => {
    const voiceMessage = req.body.message;
    const voiceSpeaker = req.body.speaker;

    //const voiceid = uuid.v4();
    const voicename = `${voiceSpeaker}_${voiceMessage}.wav`;
    const voicepath = `voices/${voicename}`;

    fs.stat(`./public/${voicepath}`, (err) => {
        if (err) {
            voicetext
                //.speaker(voicetext.SPEAKER.HARUKA)
                .speaker(voiceSpeaker)
                .speak(voiceMessage, (e, buf) => {
                    if (e) {
                        console.error(e);
                        res.status(500).end();
                    } else {
                        fs.writeFile(`./public/${voicepath}`, buf, 'binary', (e) => {
                            if (e) {
                                console.error(e);
                                res.status(500).end();
                            } else {
                                console.log(`Maked ${voicepath}`);
                                res.status(200).send(voicepath).end();
                            }
                        });
                    }
                });
        } else {
            res.status(200).send(voicepath).end();
        }
    });
});

app.post('/post-test', async (req, res) => {
    console.log(req.body);
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

http.listen(PORT, async (req, res) => {
    console.log('Server is up!');
    staff.loadStaffData();
    memo.loadMemoData();
    daikichi.loadDaikichiData();
    DialoglowUseAPI.makeKeyJsonFile();
});
