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
    const { name, allocated } = data
    if (!name || typeof allocated === 'undefined') {
      send(res, 400)
      return
    }

    const category = { name, allocated, spent: 0 }

    await dyn.put({
      TableName: CATS_TABLE,
      Item: category
    }).promise()

    // done
    send(res, 200, { category })
  } catch (e) {
    console.log(e)
    send(res, 500)
  }
}
