const { send } = require('micro')
const { validateRequest } = require('./utils')

// to check auth
module.exports = (req, res) => {
  if (!validateRequest(req)) return send(res, 401)
  send(res, 200)
}
