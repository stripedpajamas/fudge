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
    const {
      id, timestamp, pending, amount, vendor, category
    } = data
    if ([
      id,
      pending,
      amount,
      timestamp,
      vendor,
      category
    ].some(x => typeof x === 'undefined')) {
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

    // don't support changing amounts -- too messy
    if (transaction.amount !== amount) {
      send(res, 400)
      return
    }

    const UpdateExpression = []
    const ExpressionAttributeNames = {}
    const ExpressionAttributeValues = {}
    for (let key in transaction) {
      if (transaction[key] !== data[key]) {
        UpdateExpression.push(`set #${key} = :${key}`)
        ExpressionAttributeNames[`#${key}`] = key
        ExpressionAttributeValues[`:${key}`] = data[key]
      }
    }

    const TransactItems = [
      {
        Update: {
          TableName: TRANS_TABLE,
          Key: { id, timestamp },
          UpdateExpression,
          ExpressionAttributeNames,
          ExpressionAttributeValues
        }
      }
    ]

    // validate new category if necessary
    if (transaction.category !== category) {
      const { Item: retrievedCategory } = await dyn.get({
        TableName: CATS_TABLE,
        Key: { name: category }
      }).promise()
      if (!retrievedCategory) {
        send(res, 400)
        return
      }

      // we will need to update the old category and the new category
      TransactItems.push({
        Update: {
          TableName: CATS_TABLE,
          Key: { name: transaction.category },
          UpdateExpression: 'set #spent = #spent - :amount',
          ExpressionAttributeNames: { '#spent': 'spent' },
          ExpressionAttributeValues: { ':amount': transaction.amount }
        }
      })
      TransactItems.push({
        Update: {
          TableName: CATS_TABLE,
          Key: { name: category },
          UpdateExpression: 'set #spent = #spent + :amount',
          ExpressionAttributeNames: { '#spent': 'spent' },
          ExpressionAttributeValues: { ':amount': amount }
        }
      })
    }

    await dyn.transactWrite({ TransactItems }).promise()

    send(res, 200)
  } catch (e) {
    console.log(e)
    send(res, 500)
  }
}
