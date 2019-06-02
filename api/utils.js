exports.getCategoryKey = function getCategoryKey (category) {
  return `c_${category}`
}

exports.getTransactionKey = function getTransactionKey () {
  return `t_${Date.now()}`
}
