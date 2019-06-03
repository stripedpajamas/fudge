const AWS = require('aws-sdk')
const { send } = require('micro')
const query = require('micro-query')
const {
  validateRequest
} = require('../utils')
const {
  TRANS_TABLE, REGION
} = require('../constants')

AWS.config.update({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_AK,
    secretAccessKey: process.env.AWS_SK
  }
})

const dyn = new AWS.DynamoDB.DocumentClient()

module.exports = async (req, res) => {
  if (!validateRequest(req)) return send(res, 401)

  // only return x transactions
  const qs = await query(req)
  let limit = qs.limit || 100

  // scan table and filter on transactions
  const { Items: transactions } = await dyn.scan({
    TableName: TRANS_TABLE,
    Limit: limit
  }).promise()

  send(res, 200, transactions)
}
