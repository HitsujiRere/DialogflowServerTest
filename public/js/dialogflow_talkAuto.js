
const xhr = new XMLHttpRequest();

const rec = new webkitSpeechRecognition();
rec.continuous = false;
rec.interimResults = false;
rec.lang = 'ja-JP';

rec.onresult = (e) => {
    console.log('on result');
    rec.stop();

    for (var i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;

        const { transcript } = e.results[i][0];
        console.log(`Recognised: ${transcript}`);
        sendMessageToDialogflow(transcript);
    }
};

rec.onstart = () => { console.log('on start'); };
rec.onend = () => {
    console.log('on end');
    rec.start();
};

rec.onspeechstart = () => { console.log('on speech start'); };
rec.onspeechend = () => { console.log('on speech end'); };

rec.onosundstart = () => { console.log('on sound start'); };
rec.onsoundend = () => { console.log('on sound end'); };

rec.onaudiostart = () => { console.log('on audio start'); };
rec.onaudioend = () => { console.log('on audio end'); };

rec.start();

const Speech = (message) => {
    const uttr = new SpeechSynthesisUtterance(message);

    speechSynthesis.speak(uttr);
}

const sendMessageToDialogflow = (message) => {
    //const message = document.getElementById('messageInputee').value;
    var data = {
        message: message,
    };

    const to = document.createElement('p');
    to.innerHTML = `client : ${message}`;
    document.getElementById('talks').appendChild(to);

    console.log(data);

    xhr.open('POST', '/dialogflow/send', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(EncodeHTMLForm(data));

    const commentEl = document.getElementById('comment');

    xhr.onload = function () {
        commentEl.innerHTML = `Loaded: ${xhr.status} ${xhr.response}`;

        const from = document.createElement('p');
        from.innerHTML = `server : ${xhr.response}`;
        document.getElementById('talks').appendChild(from);

        Speech(xhr.response);
    };

    xhr.onerror = function () { // リクエストがまったく送信できなかったときにだけトリガーされます。
        commentEl.innerHTML = `Network Error`;
    };

    xhr.onprogress = function (event) { // 定期的にトリガーされます
        // event.loaded - ダウンロードされたバイト
        // event.lengthComputable = サーバが Content-Length ヘッダを送信した場合は true
        // event.total - トータルのバイト数(lengthComputable が true の場合)
        commentEl.innerHTML = `Received ${event.loaded} of ${event.total}`;
    };
};

function EncodeHTMLForm(data) {
    var params = [];

    for (var name in data) {
        var value = data[name];
        var param = encodeURIComponent(name) + '=' + encodeURIComponent(value);

        params.push(param);
    }

    return params.join('&').replace(/%20/g, '+');
}
