const { timingSafeEqual } = require('crypto')

const { AUTH_TOKEN } = process.env
const authToken = Buffer.from(AUTH_TOKEN, 'hex')

exports.getCategoryKey = function getCategoryKey (category) {
  return `c_${category}`
}

exports.getTransactionKey = function getTransactionKey () {
  return `t_${Date.now()}`
}

exports.validateRequest = function validateRequest (req) {
  // only allow requests with the proper auth header
  const authHeader = req.headers.authorization
  if (!authHeader) return false
  const token = authHeader.split(' ').pop()
  if (!token) return false
  const tokenBuff = Buffer.from(token, 'hex')
  if (tokenBuff.length != authToken.length) return false
  return timingSafeEqual(tokenBuff, authToken)
}
