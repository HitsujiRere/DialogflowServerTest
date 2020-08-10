
require('dotenv').config();
const uuid = require('uuid');
const fs = require('fs');
const util = require('util');
const { Transform, pipeline } = require('stream');
const { struct } = require('pb-util');

const pump = util.promisify(pipeline);

/**
 * TODO(developer): UPDATE these variables before running the sample.
 */
// projectId: ID of the GCP project where Dialogflow agent is deployed
const projectId = process.env.PROJECT_ID;
// sessionId: String representing a random number or hashed user identifier
const sessionId = uuid.v4();
// queries: A set of sequential queries to be send to Dialogflow agent for Intent Detection
//const queries = [
// 'こんにちは',
// 'おみくじ',
// '大吉みくじ',
// 'Reserve a meeting room in Toronto office, there will be 5 of us',
// 'Next monday at 3pm for 1 hour, please', // Tell the bot when the meeting is taking place
// 'B'  // Rooms are defined on the Dialogflow agent, default options are A, B, or C
// ];
// languageCode: Indicates the language Dialogflow agent should use to detect intents
const languageCode = 'ja';

// Imports the Dialogflow library
const dialogflow = require('@google-cloud/dialogflow');

// Instantiates a session client
const sessionClient = new dialogflow.SessionsClient();

// The path to the local file on which to perform speech recognition, e.g. /path/to/audio.raw
const filename = '/stream/audio.raw';

// The encoding of the audio file, e.g. 'AUDIO_ENCODING_LINEAR_16'
const encoding = 'AUDIO_ENCODING_LINEAR_16';

// The sample rate of the audio file in hertz, e.g. 16000
const sampleRateHertz = 16000;

async function executeQuery(query) {
    // The path to identify the agent that owns the created intent.
    const sessionPath = sessionClient.projectAgentSessionPath(
        projectId,
        sessionId
    );

    const initialStreamRequest = {
        session: sessionPath,
        queryInput: {
            audioConfig: {
                audioEncoding: encoding,
                sampleRateHertz: sampleRateHertz,
                languageCode: languageCode,
            },
            singleUtterance: true,
        },
    };

    // Create a stream for the streaming request.
    const detectStream = sessionClient
        .streamingDetectIntent()
        .on('error', console.error)
        .on('data', data => {
            if (data.recognitionResult) {
                console.log(
                    `Intermediate transcript: ${data.recognitionResult.transcript}`
                );
            } else {
                console.log('Detected intent:');

                const result = data.queryResult;
                // Instantiates a context client
                const contextClient = new dialogflow.ContextsClient();

                console.log(`  Query: ${result.queryText}`);
                console.log(`  Response: ${result.fulfillmentText}`);
                if (result.intent) {
                    console.log(`  Intent: ${result.intent.displayName}`);
                } else {
                    console.log('  No intent matched.');
                }

                const parameters = JSON.stringify(struct.decode(result.parameters));
                console.log(`  Parameters: ${parameters}`);
                if (result.outputContexts && result.outputContexts.length) {
                    console.log('  Output contexts:');
                    result.outputContexts.forEach(context => {
                        const contextId = contextClient.matchContextFromProjectAgentSessionContextName(
                            context.name
                        );
                        const contextParameters = JSON.stringify(
                            struct.decode(context.parameters)
                        );
                        console.log(`    ${contextId}`);
                        console.log(`      lifespan: ${context.lifespanCount}`);
                        console.log(`      parameters: ${contextParameters}`);
                    });
                }
            }
        });

    detectStream.write(initialStreamRequest);

    await pump(
        fs.createReadStream(filename),
        // Format the audio stream into the request format.
        new Transform({
            objectMode: true,
            transform: (obj, _, next) => {
                next(null, { inputAudio: obj });
            },
        }),
        detectStream
    );
}
