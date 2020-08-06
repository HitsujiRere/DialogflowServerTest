
require('dotenv').config();
const uuid = require('uuid');

const fs = require('fs');

/**
 * TODO(developer): UPDATE these variables before running the sample.
 */
// projectId: ID of the GCP project where Dialogflow agent is deployed
const projectId = process.env.PROJECT_ID;
// sessionId: String representing a random number or hashed user identifier
const sessionId = uuid.v4();
// queries: A set of sequential queries to be send to Dialogflow agent for Intent Detection
//const queries = [
//'こんにちは',
// 'おみくじ',
// '大吉みくじ',
// 'Reserve a meeting room in Toronto office, there will be 5 of us',
// 'Next monday at 3pm for 1 hour, please', // Tell the bot when the meeting is taking place
// 'B'  // Rooms are defined on the Dialogflow agent, default options are A, B, or C
// ]
// languageCode: Indicates the language Dialogflow agent should use to detect intents
const languageCode = 'ja';

// Imports the Dialogflow library
const dialogflow = require('@google-cloud/dialogflow');

// Instantiates a session client
const sessionClient = new dialogflow.SessionsClient();

async function detectIntent(
    projectId,
    sessionId,
    query,
    contexts,
    languageCode
) {
    // The path to identify the agent that owns the created intent.
    const sessionPath = sessionClient.projectAgentSessionPath(
        projectId,
        sessionId
    );

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query,
                languageCode: languageCode,
            },
        },
    };

    if (contexts && contexts.length > 0) {
        request.queryParams = {
            contexts: contexts,
        };
    }

    const responses = await sessionClient.detectIntent(request);
    return responses[0];
}

async function executeQueries(queries) {
    // Keeping the context across queries let's us simulate an ongoing conversation with the bot
    let context;
    let intentResponse;
    const fulfillmentTexts = [];
    for (const query of queries) {
        try {
            console.log(`Sending Query: ${query}`);
            intentResponse = await detectIntent(
                projectId,
                sessionId,
                query,
                context,
                languageCode
            );
            console.log('Detected intent');
            console.log(
                `Fulfillment Text: ${intentResponse.queryResult.fulfillmentText}`
            );
            fulfillmentTexts.push(intentResponse.queryResult.fulfillmentText);

            // Use the context from this response for next queries
            context = intentResponse.queryResult.outputContexts;

        } catch (error) {
            console.log(error);
        }
    }

    return fulfillmentTexts;
}

async function executeQuery(query) {
    // Keeping the context across queries let's us simulate an ongoing conversation with the bot
    let context;
    let intentResponse;
    let fulfillmentText = "";
    try {
        console.log(`Sending Query: ${query}`);
        intentResponse = await detectIntent(
            projectId,
            sessionId,
            query,
            context,
            languageCode
        );
        console.log('Detected intent');
        console.log(
            `Fulfillment Text: ${intentResponse.queryResult.fulfillmentText}`
        );
        fulfillmentText = intentResponse.queryResult.fulfillmentText;

        // Use the context from this response for next queries
        context = intentResponse.queryResult.outputContexts;

    } catch (error) {
        console.log(error);
    }
    return fulfillmentText;
}

exports.executeQuery = executeQuery;
exports.executeQueries = executeQueries;

const makeKeyJsonFile = () => {
    var data = {
        "type": "service_account",
        "project_id": process.env.PROJECT_ID,
        "private_key_id": process.env.PRIVATE_KEY_ID,
        "private_key": process.env.PRIVATE_KEY,
        "client_email": process.env.CLIENT_EMAIL,
        "client_id": process.env.CLIENT_ID,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": process.env.CLIENT_x509_CERT_URL
    }

    data.private_key = data.private_key.replace(/\\n/g, '\n');

    console.log(JSON.stringify(data, null, '  '));

    fs.writeFile(
        process.env.GOOGLE_APPLICATION_CREDENTIALS,
        JSON.stringify(data, null, '  '),
        (err) => {
            if (err == null) {
                console.log('Maked dialogflow json file!');
            }
            else {
                console.log(err);
            }
        }
    );
}
exports.makeKeyJsonFile = makeKeyJsonFile;
