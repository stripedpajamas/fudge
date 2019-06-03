const AWS = require('aws-sdk')
const { json, send } = require('micro')
const { validateRequest } = require('../utils')
const {
  TRANS_TABLE, CATS_TABLE, REGION
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
  try {
    // get transaction params from request object
    const data = await json(req)
    if (!data || typeof data !== 'object') {
      send(res, 400)
      return
    }
    const { id, timestamp } = data
    if (!id || !timestamp) {
      send(res, 400)
      return
    }

    // get transaction
    const { Item: transaction } = await dyn.get({
      TableName: TRANS_TABLE,
      Key: { id, timestamp }
    }).promise()
    if (!transaction) {
      send(res, 400)
      return
    }

    // delete transaction and update category
    await dyn.transactWrite({
      TransactItems: [{
        Delete: {
          TableName: TRANS_TABLE,
          Key: { id, timestamp }
        }
      }, {
        Update: {
          TableName: CATS_TABLE,
          Key: { name: transaction.category },
          UpdateExpression: 'set #spent = #spent - :amount',
          ExpressionAttributeNames: { '#spent': 'spent' },
          ExpressionAttributeValues: { ':amount': transaction.amount }
        }
      }]
    }).promise()

    send(res, 200)
  } catch (e) {
    console.log(e)
    send(res, 500)
  }
}
