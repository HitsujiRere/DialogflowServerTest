
const xhr = new XMLHttpRequest();
const socket = io();

// for html
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');

// for audio
let audio_sample_rate = null;
let scriptProcessor = null;
let audioContext = null;

// audio data
let audioData = [];
let bufferSize = 1024;

socket.on('connect', (msg) => {
    console.log(msg);
    startButton.disabled = false;
    //const pEl = document.createElement('p');
    //pEl.innerHTML = msg;
    //document.getElementById('talks').appendChild(pEl);
});

startButton.addEventListener('click', () => {
    startButton.disabled = true;

    navigator.getUserMedia(
        { audio: true },
        (stream) => {
            recordAudio = RecordRTC(
                stream,
                {
                    type: 'audio',

                    mimeType: 'audio/webm',
                    sampleRate: 44100,
                    // used by StereoAudioRecorder
                    // the range 22050 to 96000.
                    // let us force 16khz recording:
                    desiredSampRate: 16000,

                    // MediaStreamRecorder, StereoAudioRecorder, WebAssemblyRecorder
                    // CanvasRecorder, GifRecorder, WhammyRecorder
                    recorderType: StereoAudioRecorder,
                    // Dialogflow / STT requires mono audio
                    numberOfAudioChannels: 1,

                    // get intervals based blobs
                    // value in milliseconds
                    // as you might not want to make detect calls every seconds
                    timeSlice: 4000,

                    ondataavailable: function (blob) {
                        console.log('here');
                        // making use of socket.io-stream for bi-directional
                        // streaming, create a stream
                        var stream = ss.createStream();
                        // stream directly to server
                        // it will be temp. stored locally
                        ss(socket).emit('stream-media', stream, {
                            name: 'stream.wav',
                            size: blob.size
                        });
                        // pipe the audio blob to the read stream
                        ss.createBlobReadStream(blob).pipe(stream);
                    }
                }
            );

            recordAudio.startRecording();
            startButton.disabled = false;
        },
        (error) => {
            console.error(JSON.stringify(error));
        }
    );
});

stopButton.onclick = function () {
    // recording stopped
    stopButton.disabled = false;
    stopButton.disabled = true;

    // stop audio recorder
    recordAudio.stopRecording(() => {
        // after stopping the audio, get the audio data
        recordAudio.getDataURL((audioDataURL) => {

            //2)
            var files = {
                audio: {
                    type: recordAudio.getBlob().type || 'audio/wav',
                    dataURL: audioDataURL
                }
            };
            // submit the audio file to the server
            io.emit('message', files);
        });
    });
};

// when the server found results send
// it back to the client
const resultpreview = document.getElementById('results');
socket.on('results', (data) => {
    console.log(data);
    // show the results on the screen
    if (data[0].queryResult) {
        resultpreview.innerHTML += "" + data[0].queryResult.fulfillmentText;
    }
});



const sendVoice = (audioBlob) => {

    console.log(audioBlob);

    xhr.open('POST', '/dialogflow_voice/send', true);
    //xhr.responseType = 'blob';
    const b = new Blob(['hello world'], { type: 'text/plain' });
    xhr.send(audioBlob);

    xhr.onload = () => {
        console.log(`Loaded: ${xhr.status} ${xhr.response}`);

        const from = document.createElement('p');
        from.innerHTML = `server : ${xhr.response}`;
        document.getElementById('talks').appendChild(from);
    };

    xhr.onerror = () => { // リクエストがまったく送信できなかったときにだけトリガーされます。
        console.log(`Network Error`);
    };

    xhr.onprogress = () => { // 定期的にトリガーされます
        // event.loaded - ダウンロードされたバイト
        // event.lengthComputable = サーバが Content-Length ヘッダを送信した場合は true
        // event.total - トータルのバイト数(lengthComputable が true の場合)
        console.log(`Received ${event.loaded} of ${event.total}`);
    };
};
