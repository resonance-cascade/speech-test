const EventEmitter = require('events').EventEmitter
const getUserMedia = require('getusermedia')
const Speech = require('@google-cloud/speech')
const path = require('path')
const audio = require('audio-stream')
const pcm = require('pcm-stream')
const assert = require('assert')

function TextToSpeech (opts) {
  if (!(this instanceof TextToSpeech)) return new TextToSpeech()
  if (!opts) opts = {}
  assert.ok(opts.projectId, 'TextToSpeech: Missing projectId in options')
  assert.ok(opts.keyFilename, 'TextToSpeech: Missing keyFilename path in options')
  this._opts = Object.assign({
    request: { config: { encoding: 'LINEAR16', sampleRate: 44100 },
      singleUtterance: false,
      interimResults: false,
      verbose: true
    }
  }, opts)

  this.mediaStream = null
  this.sourceStream = null
  this.sinkStream = null
  this.listening = false
  this.paused = false

  EventEmitter.call(this)
}

TextToSpeech.prototype = Object.create(EventEmitter.prototype)

TextToSpeech.prototype.listen = function () {
  if (this.listening) return this.emit('status', 'Already Listening')
  if (!this.mediaStream)
  if (!this.sourceStream)
  if (!this.mediaStream)
}

TextToSpeech.prototype.pause = function () {

}

TextToSpeech.prototype.stop = function () {

}

const myPath = path.join(__dirname, 'auth.json')

const speech = Speech({
  projectId: 'dexter-dev-env',
  keyFilename: myPath
})

const request = { config: { encoding: 'LINEAR16', sampleRate: 44100 },
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
    volume: 1
  })
  sourceStream
        .pipe(pcm())
        .pipe(recognizeStream)
  console.log(mediaStream)
  console.log(sourceStream)
  console.log(recognizeStream)
})
