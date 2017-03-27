// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const record = require('node-record-lpcm16') // [START speech_streaming_mic_recognize]
const Speech = require('@google-cloud/speech') // Imports the Google Cloud client library
const path = require('path')
    // const speech = Speech() // Instantiates a client
const myPath = path.join(__dirname, '/auth.json')
    // adjust_path_to_os(__dirname + '/dexter-dev-env-b05da431ead6.json')

const speech = Speech({
  projectId: 'dexter-dev-env',
  keyFilename: myPath
})

    // from https://github.com/GoogleCloudPlatform/google-cloud-node#cloud-speech-alpha
    // const speechClient = speech({
    //    projectId: 'dexter-dev-env',
    //   keyFilename:  adjust_path_to_os(__dirname + '/dexter-dev-env-b05da431ead6.json')
    // })

const request = { config: { encoding: 'LINEAR16', sampleRate: 16000 },
  singleUtterance: false,
  interimResults: false,
  verbose: true}
    // Create a recognize stream
const recognizeStream = speech.createRecognizeStream(request)
            .on('error', console.error)
            .on('data', function (data) {
              console.log(data.endpointerType)
              if (data.results.length > 0) console.log(data.results[0].transcript)
            })
              // process.stdout.write(data.results)

    // Start recording and send the microphone input to the Speech API
record.start({
  sampleRate: 16000,
  threshold: 0
}).pipe(recognizeStream)
console.log('Listening, press Ctrl+C to stop.')
