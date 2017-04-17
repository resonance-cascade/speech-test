var EventEmitter = require('events').EventEmitter
var getUserMedia = require('getusermedia')
var Speech = require('@google-cloud/speech')
var audio = require('audio-stream')
var pcm = require('pcm-stream')
var assert = require('assert')
var pumpify = require('pumpify')
var writer = require('flush-write-stream')
var pump = require('pump')

module.exports = SpeechToText

function SpeechToText (opts) {
  if (!(this instanceof SpeechToText)) return new SpeechToText()
  if (!opts) opts = {}
  assert.ok(opts.projectId, 'SpeechToText: Missing projectId in options')
  assert.ok(opts.keyFilename, 'SpeechToText: Missing keyFilename path in options')
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
  this.audioStream = null
  this.sinkStream = null
  this.pipeline = null
  this.listening = false
  this.waiting = false

  var self = this

  getUserMedia({video: false, audio: true}, function (err, ms) {
    if (err) throw err
    self.mediaStream = ms
    self.emit('mediaStream', ms)
  })

  EventEmitter.call(this)
}

SpeechToText.prototype = Object.create(EventEmitter.prototype)

SpeechToText.prototype.listen = function () {
  var self = this
  if (this.listening) return this.emit('status', 'Already Listening')

  if (!this.mediaStream) {
    if (this.waiting) return this.emit('status', 'Waiting for userMedia')
    this.waiting = true
    return this.once('mediaStream', function () {
      self.waiting = false
      self.listen()
    })
  }

  if (!this.sinkStream) {
    var recognizeStream = this.speech.createRecognizeStream(this._opts.request)
    var emitter = writer.obj(function (data, enc, cb) {
      self.emit('data', data)
      cb()
    })
    this.sinkStream = pumpify(pcm(), recognizeStream, emitter)
  }

  if (!this.audioStream) {
    this.audioStream = audio(this.mediaStream, {
      channels: 1,
      volume: 0.8
    })
  }
  this.listening = true
  this.emit('listening', true)
  this.emit('status', 'Started listening')
  this.pipeline = pump(this.audioStream, this.sinkStream, function (err) {
    if (err) self.emit('error', err)
    self.clearPipeline()
  })
}

SpeechToText.prototype.clearPipeline = function () {
  this.listening = false
  this.emit('listening', false)
  this.audioStream = null
  this.sinkStream = null
  this.pipeline = null
  // this.mediaStream.getAudioTracks().forEach(function (track) {
  //  track.stop()
  // })
  this.emit('status', 'Stopped listening')
}

SpeechToText.prototype.stop = function () {
  if (this.listening) this.audioStream.destroy()
  else this.emit('status', 'Already Stopped')
}
