const Cookies = require('js-cookie')
const API = require('../api')

module.exports = async function (state, emitter) {
  state.title = 'Fudge 🐿'
  state.api = null
  // initial state
  state.login = {
    authenticated: false,
    loading: false,
    usingCookie: false,
    error: false
  }

  // check for cookie first and possibly construct the api
  const cookieToken = Cookies.get('fudge')
  if (cookieToken) {
    // update the UI to show we are trying to login
    state.login.loading = true
    state.login.usingCookie = true
    emitter.emit('render')

    const api = await API(null, cookieToken)
    const authenticated = await api.checkAuth()
    if (!authenticated) {
      // cookie is bogus
      Cookies.remove('fudge')
      state.login.authenticated = false
      state.login.loading = false
      state.login.error = true
    } else {
      state.login.authenticated = true
      state.login.loading = false
      state.login.error = false
      state.api = api
    }
    emitter.emit('render')
  }

  emitter.on('login:authenticate', async function ({ password }) {
    state.login.usingCookie = false
    state.login.error = false
    state.login.loading = true
    emitter.emit('render')

    const api = await API(password)
    const authenticated = await api.checkAuth()
    if (!authenticated) {
      state.login.authenticated = false
      state.login.loading = false
      state.login.error = true
    } else {
      // password worked -- set a cookie
      Cookies.set('fudge', api.getToken())
      state.login.authenticated = true
      state.login.loading = false
      state.login.error = false
    }
    emitter.emit('render')
  })
}
