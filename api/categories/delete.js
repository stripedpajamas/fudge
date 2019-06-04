const AWS = require('aws-sdk')
const { json, send } = require('micro')
const { validateRequest } = require('../utils')
const {
  CATS_TABLE, REGION
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
    // get category params from request object
    const data = await json(req)
    if (!data || typeof data !== 'object') {
      send(res, 400)
      return
    }
    const { name } = data
    if (!name) {
      send(res, 400)
      return
    }

    // confirm no transactions are associated with category
    const { Item: category } = await dyn.get({
      TableName: CATS_TABLE,
      Key: { name }
    }).promise()
    if (!category) {
      send(res, 400)
      return
    }
    if (category.spent !== 0) {
      send(res, 400, {
        message: 'Disassociate all transactions before deleting category'
      })
      return
    }

    await dyn.delete({
      TableName: CATS_TABLE,
      Key: { name }
    }).promise()

    // done
    send(res, 200)
  } catch (e) {
    console.log(e)
    send(res, 500)
  }
}
