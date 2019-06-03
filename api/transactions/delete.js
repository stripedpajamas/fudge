const AWS = require('aws-sdk')
const { json, send } = require('micro')
const {
  getCategoryKey,
  validateRequest
} = require('../utils')
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
  if (!validateRequest(req)) return send(res, 401)
  try {
    // get transaction params from request object
    const data = await json(req)
    if (!data || typeof data !== 'object') {
      send(res, 400)
      return
    }
    const { id } = data
    if (!id) {
      send(res, 400)
      return
    }

    // get transaction
    const { Item: transaction } = await dyn.get({
      TableName: TABLE_NAME,
      Key: { id }
    }).promise()
    if (!transaction) {
      send(res, 400)
      return
    }

    // delete transaction and update category
    await dyn.transactWrite({
      TransactItems: [{
        Delete: {
          TableName: TABLE_NAME,
          Key: { id }
        }
      }, {
        Update: {
          TableName: TABLE_NAME,
          Key: { id: getCategoryKey(transaction.data.category) },
          UpdateExpression: 'set #data.#spent = #data.#spent - :amount',
          ExpressionAttributeNames: { '#data': 'data', '#spent': 'spent' },
          ExpressionAttributeValues: { ':amount': transaction.data.amount }
        }
      }]
    }).promise()

    // done - return the updated category to the client
    send(res, 200)
  } catch (e) {
    console.log(e)
    send(res, 500)
  }
}
