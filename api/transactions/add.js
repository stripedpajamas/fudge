const AWS = require('aws-sdk')
const { json, send } = require('micro')
const {
  getCategoryKey,
  getTransactionKey,
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
    const {
      pending, amount, date, vendor, category
    } = data
    if ([pending, amount, date, vendor, category].some(x => typeof x === 'undefined')) {
      send(res, 400)
      return
    }

    // validate category
    const { Item: retrievedCategory } = await dyn.get({
      TableName: TABLE_NAME,
      Key: { id: getCategoryKey(category) }
    }).promise()
    if (!retrievedCategory) {
      send(res, 400)
      return
    }

    const transaction = {
      id: getTransactionKey(),
      data: { pending, amount, date, vendor, category }
    }

    await dyn.transactWrite({
      TransactItems: [{
        Put: {
          TableName: TABLE_NAME,
          Item: transaction
        }
      }, {
        Update: {
          TableName: TABLE_NAME,
          Key: { id: getCategoryKey(category) },
          UpdateExpression: 'set #data.#spent = #data.#spent + :amount',
          ExpressionAttributeNames: { '#data': 'data', '#spent': 'spent' },
          ExpressionAttributeValues: { ':amount': transaction.data.amount },
          ReturnValues: 'ALL_NEW'
        }
      }]
    }).promise()

    // done
    send(res, 200, { transaction })
  } catch (e) {
    console.log(e)
    send(res, 500)
  }
}
