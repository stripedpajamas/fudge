const AWS = require('aws-sdk')
const { send } = require('micro')
const {
  TABLE_NAME, REGION
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
  // scan table and filter on transactions
  const { Items: transactions } = await dyn.scan({
    TableName: TABLE_NAME,
    FilterExpression: 'begins_with (id, :t)',
    ExpressionAttributeValues: { ':t': 't_' }
  }).promise()

  send(res, 200, transactions)
}
