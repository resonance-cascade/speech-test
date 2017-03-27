const record = require('node-record-lpcm16'); // [START speech_streaming_mic_recognize]


    // Start recording and send the microphone input to the Speech API
var audioStream = record.start({
        sampleRate: 16000,
        threshold: 0,
        verbose: true
    })

audioStream.pipe(process.stdout);
    console.log('Listening, press Ctrl+C to stop.');
