
const xhr = new XMLHttpRequest();

// for html
const downloadLink = document.getElementById('download');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');

// for audio
let audio_sample_rate = null;
let scriptProcessor = null;
let audioContext = null;

// audio data
let audioData = [];
let bufferSize = 1024;

startButton.addEventListener('click', () => {
    startRecording();
});

// stop button
stopButton.addEventListener('click', () => {
    saveAudio();
    console.log('saved wav');
});

const startRecording = () => {
    // getUserMedia
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(handleSuccess);

    startButton.disabled = true;
    stopButton.disabled = false;
}

const saveAudio = () => {
    const audioBlob = exportBlob(audioData);

    downloadLink.href = exportWAV(audioBlob);
    downloadLink.download = 'test.wav';
    downloadLink.click();

    audioContext.close().then(function () {
        stopButton.disabled = true;
        startButton.disabled = false;
    });

    sendVoice(audioBlob);
}

const exportWAV = (audioBlob) => {
    let myURL = window.URL || window.webkitURL;
    let url = myURL.createObjectURL(audioBlob);
    return url;
}

// export WAV from audio float data
const exportBlob = (audioData) => {

    const encodeWAV = (samples, sampleRate) => {
        let buffer = new ArrayBuffer(44 + samples.length * 2);
        let view = new DataView(buffer);

        const writeString = (view, offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        const floatTo16BitPCM = (output, offset, input) => {
            for (let i = 0; i < input.length; i++, offset += 2) {
                let s = Math.max(-1, Math.min(1, input[i]));
                output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        };

        writeString(view, 0, 'RIFF');  // RIFFヘッダ
        view.setUint32(4, 32 + samples.length * 2, true); // これ以降のファイルサイズ
        writeString(view, 8, 'WAVE'); // WAVEヘッダ
        writeString(view, 12, 'fmt '); // fmtチャンク
        view.setUint32(16, 16, true); // fmtチャンクのバイト数
        view.setUint16(20, 1, true); // フォーマットID
        view.setUint16(22, 1, true); // チャンネル数
        view.setUint32(24, sampleRate, true); // サンプリングレート
        view.setUint32(28, sampleRate * 2, true); // データ速度
        view.setUint16(32, 2, true); // ブロックサイズ
        view.setUint16(34, 16, true); // サンプルあたりのビット数
        writeString(view, 36, 'data'); // dataチャンク
        view.setUint32(40, samples.length * 2, true); // 波形データのバイト数
        floatTo16BitPCM(view, 44, samples); // 波形データ

        return view;
    };

    const mergeBuffers = (audioData) => {
        let sampleLength = 0;
        for (let i = 0; i < audioData.length; i++) {
            sampleLength += audioData[i].length;
        }
        let samples = new Float32Array(sampleLength);
        let sampleIdx = 0;
        for (let i = 0; i < audioData.length; i++) {
            for (let j = 0; j < audioData[i].length; j++) {
                samples[sampleIdx] = audioData[i][j];
                sampleIdx++;
            }
        }
        return samples;
    };

    let dataview = encodeWAV(mergeBuffers(audioData), audio_sample_rate);
    let audioBlob = new Blob([dataview], { type: 'audio/wav' });
    console.log(dataview);

    return audioBlob;
};

// save audio data
const onAudioProcess = (e) => {
    var input = e.inputBuffer.getChannelData(0);
    var bufferData = new Float32Array(bufferSize);
    for (var i = 0; i < bufferSize; i++) {
        bufferData[i] = input[i];
    }

    audioData.push(bufferData);
};

// getusermedia
const handleSuccess = (stream) => {
    audioContext = new AudioContext();
    audio_sample_rate = audioContext.sampleRate;
    console.log(audio_sample_rate);
    scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    var mediastreamsource = audioContext.createMediaStreamSource(stream);
    mediastreamsource.connect(scriptProcessor);
    scriptProcessor.onaudioprocess = onAudioProcess;
    scriptProcessor.connect(audioContext.destination);

    console.log('record start?');

    // when time passed without pushing the stop button
    setTimeout(() => {
        console.log("10 sec");
        if (stopButton.disabled == false) {
            saveAudio();
            console.log("saved audio");
        }
    }, 10000);
};



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
