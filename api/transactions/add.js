const AWS = require('aws-sdk')
const { json, send } = require('micro')
const { ulid } = require('ulid')
const { validateRequest } = require('../utils')
const {
  CATS_TABLE, TRANS_TABLE, REGION
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
      pending, amount, timestamp, vendor, category
    } = data
    if ([pending, amount, timestamp, vendor, category].some(x => typeof x === 'undefined')) {
      send(res, 400)
      return
    }

    // validate category
    const { Item: retrievedCategory } = await dyn.get({
      TableName: CATS_TABLE,
      Key: { name: category }
    }).promise()
    if (!retrievedCategory) {
      send(res, 400)
      return
    }

    const transaction = {
      id: ulid(),
      timestamp,
      pending,
      amount,
      vendor,
      category
    }

    await dyn.transactWrite({
      TransactItems: [{
        Put: {
          TableName: TRANS_TABLE,
          Item: transaction
        }
      }, {
        Update: {
          TableName: CATS_TABLE,
          Key: { name: category },
          UpdateExpression: 'set #spent = #spent + :amount',
          ExpressionAttributeNames: { '#spent': 'spent' },
          ExpressionAttributeValues: { ':amount': transaction.amount },
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
