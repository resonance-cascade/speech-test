var choo = require('choo')
var html = require('choo/html')
var app = window.hyperamp = choo()

app.use(store)

app.route('/', view)
app.mount('#app')

function store (state, bus) {
  state.msgs = []
  state.listening = false

  bus.on('clear', clear)
  function clear () {
    state.msgs = []
    bus.emit('render')
  }

  bus.on('listen', listen)
  function listen () {
    if (state.listening) {
      state.msgs.push('already listening')
    } else {
      state.msgs.push('listening')
      state.listening = true
    }
    bus.emit('render')
  }

  bus.on('stop', stop)
  function stop () {
    if (state.listening) {
      state.msgs.push('stopped listening')
      state.listening = false
    } else {
      state.msgs.push('already not listening')
    }
    bus.emit('render')
  }
}

function view (state, emit) {
  return html`
    <main>
      <div>
        ${state.listening
          ? html`<button onclick=${() => emit('stop')}>stop</button>`
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
