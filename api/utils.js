const { timingSafeEqual } = require('crypto')

const { F_AUTH_TOKEN } = process.env
const authToken = Buffer.from(F_AUTH_TOKEN, 'hex')

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
