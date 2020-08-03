'use strict';

const daikichi = require('./daikichi');
const memo = require('./memo');

exports.dialogflow = function (queryResult) {
    const displayName = queryResult.intent.displayName;

    switch (displayName) {
        case 'Game':
            const gameName = queryResult.parameters.game;

            switch (gameName) {
                case 'おみくじ':
                    const kuji = omikuji();
                    return `${kuji}を引きました！`;

                case 'じゃんけん':
                    const hand = janken();
                    return `${hand}！`;

                case '占い':
                    return result;

                default:
                    return `なんのゲームか分かりませんでした...`;
            }

        case 'PushMemo':
            const name = 'dialogflow';
            const date = queryResult.parameters.date;
            const time = queryResult.parameters.time;
            const doing = queryResult.parameters.memodoing;
            const title = `${doing} : ${date} ${time}`;
            const body = `${doing} : ${date} ${time} ( ${queryResult.queryText} )`;
            console.log(`body = ${title}`);
            console.log(`body = ${body}`);

            const result = memo.pushMemoData(name, title, body) ? 'Correct!' : 'Failed...';
            return `Memoに「${body}」と書き込みました`;

        case 'Daikichi':
            const daikichiMessage = daikichi.daikichiData[Math.floor(Math.random() * daikichi.daikichiData.length)].message;
            return daikichiMessage;

        default:
            return `Node.jsから「${queryResult.queryText} 」`;
    }
}

const kujis = ['大吉', '中吉', '小吉', '吉'];
function omikuji() {
    const kuji = kujis[Math.floor(Math.random() * kujis.length)];
    return kuji;
}

const jankenHands = ['ぐー', 'ちょき', 'ぱー'];
function janken() {
    const hand = jankenHands[Math.floor(Math.random() * jankenHands.length)];
    return hand;
}

const uranaiResult = ['1', '2', '3', '4'];
function uranai() {
    const res = uranaiResult[Math.floor(Math.random() * uranaiResult.length)];
    return res;
}
