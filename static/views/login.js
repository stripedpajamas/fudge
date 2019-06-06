const html = require('choo/html')
const Form = require('../components/form')

module.exports = function (state, emit) {
  const form = Form({
    onSubmit: (pwd) => emit('authenticate', pwd)
  })

  return html`
    <h1>hello world</h1>
    <
  `
}
