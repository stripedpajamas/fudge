const css = require('sheetify')
const choo = require('choo')

const withLayout = require('./components/layout')

const loginView = withLayout(require('./views/login'), 'Login')

const withAuth = handler => (state, emit) => state.authenticated
  ? loginView(state, emit)
  : handler(state, emit)

css('tachyons')
const app = choo()

app.use(require('choo-devtools')())
app.use(require('./stores/login'))

app.route('/', loginView)

module.exports = app.mount('body')
