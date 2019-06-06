const html = require('choo/html')
const getFormData = require('get-form-data')

module.exports = function (state, emit) {
  const { error, loading, usingCookie } = state.login
  function getPromptText () {
    if (loading) {
      return 'Loading...'
    }
    if (error) {
      return usingCookie
        ? 'Please enter your password'
        : 'Password incorrect, please try again'
    }
  }
  return html`
    <section>
      <form onsubmit=${authenticate}>
        <p>${getPromptText()}</p>
        <input type="password" name="password" ${loading && 'disabled'}/>
        <input type="submit" />
      </form>
    </section>
  `
  function authenticate (e) {
    const { password } = getFormData(e.currentTarget)
    emit('login:authenticate', { password })
  }
}
