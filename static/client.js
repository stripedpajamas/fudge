const css = require('sheetify')
const choo = require('choo')

const loginView = require('./views/login')

const withAuth = handler => (state, emit) => state.authenticated
  ? loginView(state, emit)
  : handler(state, emit)

css('tachyons')
const app = choo()

app.use(require('choo-devtools')())
app.use(require('./stores/login'))

app.route('/', loginView)

module.exports = app.mount('body')
