const Cookies = require('js-cookie')
const api = require('../api')

module.exports = async function (state, emitter) {
  state.title = 'Fudge 🐿'

  // check for cookie first and possibly construct the api
  const cookieToken = Cookies.get('fudge')
  if (cookieToken) {
    state.api = await api(null, cookieToken)
    const transactions = await state.api.getTransactions()
    if (transactions) state.transactions = transactions
    emitter.emit('render')
  }

  emitter.on('authenticate', async function ({ password }) {
    state.api = await api(password)
    emitter.emit('render')
  })

  emitter.on('getTransactions', async function () {
    if (!state.api) return
    state.transactions = await state.api.getTransactions()
    emitter.emit('render')
  })
}
