var EventEmitter = require('events').EventEmitter
var getUserMedia = require('getusermedia')
var Speech = require('@google-cloud/speech')
var audio = require('audio-stream')
var pcm = require('pcm-stream')
var assert = require('assert')
var pumpify = require('pumpify')
var writer = require('flush-write-stream')
var pump = require('pump')

module.exports = TextToSpeech

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

  this.speech = Speech({
    projectId: this._opts.projectId,
    keyFilename: this._opts.keyFilename
  })
  this.mediaStream = null
  this.sourceStream = null
  this.sinkStream = null
  this.pipeline = null
  this.listening = false
  this.paused = false
  this.waiting = false

  var self = this

  getUserMedia({video: false, audio: true}, function (err, ms) {
    if (err) throw err
    console.log('got media stream')
    self.mediaStream = ms
    self.emit('mediaStream', ms)
  })

  EventEmitter.call(this)
}

TextToSpeech.prototype = Object.create(EventEmitter.prototype)

TextToSpeech.prototype.listen = function () {
  var self = this
  if (this.listening) return this.emit('status', 'Already Listening')

  if (!this.mediaStream) {
    console.log('missing media stream')
    if (this.waiting) return this.emit('status', 'Waiting for userMedia')
    this.waiting = true
    return this.once('mediaStream', function () {
      this.listen()
    })
  }

  if (!this.sinkStream) {
    console.log('created sink Stream')
    var recognizeStream = this.speech.createRecognizeStream(this._opts.request)
    var emitter = writer.obj(function (data, enc, cb) {
      self.emit('data', data)
      cb()
    })
    this.sinkStream = pumpify(pcm(), recognizeStream, emitter)
  }

  if (!this.sourceStream) {
    console.log('created audio stream')
    this.sourceStream = audio(this.mediaStream, {
      channels: 1,
      volume: 1
    })
  }
  this.listening = true
  this.emit('listening', true)
  console.log('now listening')
  pump(this.sourceStream, this.sinkStream, function (err) {
    if (err) console.error(err)
  })
}

TextToSpeech.prototype.pause = function () {
  if (!this.listening) return this.emit('status', 'Not Listening, Cant payse')
  if (this.paused) return this.emit('status', 'Already Paused')
  this.paused = true
  this.emit('paused', true)
  this.sourceStream.suspend()
}

TextToSpeech.prototype.resume = function () {
  if (!this.listening) return this.emit('status', 'Not Listening, Cant resume')
  if (!this.paused) return this.emit('status', 'Not paused, cant resume')
  this.paused = false
  this.emit('paused', false)
  this.sourceStream.restart()
}

TextToSpeech.prototype.stop = function () {
  this.pipeline.detroy()
  this.listening = false
  this.emit('listening', false)
  this.paused = false
  this.emit('paused', false)
  this.sourceStream = null
  this.sinkStream = null
  this.pipeline = null
  this.mediaStream.getAudioTracks().forEach(function (track) {
    track.stop()
  })
}
