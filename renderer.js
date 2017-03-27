
const getUserMedia = require('getusermedia')
const Speech = require('@google-cloud/speech')
const path = require('path')
const audio = require('audio-stream')
const pcm = require('pcm-stream')

const myPath = path.join(__dirname, '/auth.json')


const speech = Speech({
  projectId: 'dexter-dev-env',
  keyFilename: myPath
})



const request = { config: { encoding: 'LINEAR16', sampleRate: 16000 },
  singleUtterance: false,
  interimResults: false,
  verbose: true}

const recognizeStream = speech.createRecognizeStream(request)
            .on('error', console.error)
            .on('data', function (data) {
              console.log(data.endpointerType)
              if (data.results.length > 0) console.log(data.results[0].transcript)
            })

getUserMedia({video: false, audio: true}, function (err, mediaStream) {
  if (err) return console.error(err)
  var sourceStream = audio(mediaStream, {
    channels: 1,
    volume: 0.8
  })
  sourceStream
        .pipe(pcm())
        .pipe(recognizeStream)
})
