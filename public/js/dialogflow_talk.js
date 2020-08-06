
const xhr = new XMLHttpRequest();

const sendMessageToDialogflow = () => {
    const message = document.getElementById('messageInputee').value;
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
