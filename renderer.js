var choo = require('choo')
var html = require('choo/html')
var app = window.hyperamp = choo()
var TextToSpeech = require('./text-to-speech')
var path = require('path')
var log = require('choo-log')
var t2s = new TextToSpeech({
  projectId: 'dexter-dev-env',
  keyFilename: path.join(__dirname, 'auth.json')
})

app.use(log())
app.use(store)

app.route('/', view)
app.mount('#app')

function store (state, bus) {
  state.msgs = []
  state.listening = false
  state.paused = false
  t2s.on('error', log)
  t2s.on('status', log)
  function log (data) {
    state.msgs.push(data)
    bus.emit('render')
  }

  t2s.on('data', apiLog)
  function apiLog (data) {
    state.msgs.push(JSON.stringify(data))
    bus.emit('render')
  }

  t2s.on('paused', function (status) {
    state.paused = status
    bus.emit('render')
  })

  t2s.on('listening', function (status) {
    state.listening = status
    bus.emit('render')
  })

  bus.on('clear', clear)
  function clear () {
    state.msgs = []
    bus.emit('render')
  }

  bus.on('listen', listen)
  function listen () {
    t2s.listen()
  }

  bus.on('stop', stop)
  function stop () {
    t2s.stop()
  }

  bus.on('pause', pause)
  function pause () {
    t2s.pause()
  }

  bus.on('resume', resume)
  function resume () {
    t2s.resume()
  }
}

function view (state, emit) {
  return html`
    <main>
      <div>
        ${state.listening
          ? html`
            <div>
              <button onclick=${() => emit('stop')}>stop</button>
              ${state.paused
                ? html`<button onclick=${() => emit('resume')}>resume</button>`
                : html`<button onclick=${() => emit('pause')}>pause</button>`}
            </div>`
          : html`<button onclick=${() => emit('listen')}>start</button>`}
      </div>
      <div>output</div>
      <div>
        ${state.msgs.map(msg => html`
          <div>${msg}</div>
        `)}
      </div>
    </main>
  `
}
