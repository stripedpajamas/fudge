const AWS = require('aws-sdk')
const { send } = require('micro')
const {
  validateRequest
} = require('../utils')
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

  const { Items: categories } = await dyn.scan({
    TableName: CATS_TABLE
  }).promise()

  send(res, 200, categories)
}
