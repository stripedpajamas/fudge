const fetch = require('isomorphic-fetch')
const Cookies = require('js-cookie')

// thank you sindre sorhus
const bufferToHex = (buffer) => {
  const view = new DataView(buffer)

  let hexCodes = ''
  for (let i = 0; i < view.byteLength; i += 4) {
    hexCodes += view.getUint32(i).toString(16).padStart(8, '0')
  }

  return hexCodes
}

module.exports = async (password, cookieToken) => {
  let token
  if (password) {
    const buffer = new TextEncoder().encode(password)
    const digest = await window.crypto.subtle.digest('SHA-256', buffer)
    token = bufferToHex(digest)
  } else {
    token = cookieToken
  }
  Cookies.set('fudge', token)

  function getOptions (method, body) {
    const options = {
      method,
      headers: { authorization: `Bearer ${token}` }
    }
    if (body) options.body = JSON.stringify(body)
    return options
  }

  return {
    getTransactions () {
      fetch('/api/transactions', getOptions('get'))
    }
  }
}
