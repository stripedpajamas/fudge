const AWS = require('aws-sdk')
const { json, send } = require('micro')
const {
  getCategoryKey,
  getTransactionKey
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

    const transaction = { pending, amount, date, vendor, category }

    // put the transaction into dynamo
    await dyn.put({
      TableName: TABLE_NAME,
      Item: {
        id: getTransactionKey(),
        data: transaction
      }
    }).promise()

    // update the category with the amount spent
    const { Attributes: updatedCategory } = await dyn.update({
      TableName: TABLE_NAME,
      Key: { id: getCategoryKey(category) },
      UpdateExpression: 'set #data = :data',
      ExpressionAttributeNames: { '#data': 'data' },
      ExpressionAttributeValues: {
        ':data': {
          ...retrievedCategory.data,
          spent: retrievedCategory.data.spent + transaction.amount
        }
      },
      ReturnValues: 'ALL_NEW'
    }).promise()

    // done - return the updated category to the client
    send(res, 200, updatedCategory)
  } catch (e) {
    console.log(e)
    send(res, 500)
  }
}
