import express from 'express'
import payload from 'payload'
let nodemailer = require("nodemailer");
let aws = require("@aws-sdk/client-ses");
let { defaultProvider } = require("@aws-sdk/credential-provider-node");

const ses = new aws.SES({
  apiVersion: "2010-12-01",
  region: "us-east-2",
  defaultProvider,
})

// create Nodemailer SES transporter
let transporter = nodemailer.createTransport({
  SES: { ses, aws },
});

require('dotenv').config()
const app = express()

// Redirect root to Admin panel
app.get('/', (_, res) => {
  res.redirect('/admin')
})

const start = async () => {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET,
    express: app,
    onInit: async () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
    },
    ...(process.env.AWS_SECRET_ACCESS_KEY
      ? {
        email: {
          fromName: "Crazy Horse Memorial",
          fromAddress: "noreply@crazyhorsememorial.org",
          transport: transporter
        },
      }
      : {}),
  })

  // Add your own express routes here

  app.listen(3000)
}

start()
