import express from 'express'
import payload from 'payload'
let nodemailer = require("nodemailer");
require('dotenv').config()
const app = express()

const smtpPort = Number(process.env.EMAIL_PORT) || 587
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
    email: {
      fromName: "Crazy Horse Memorial",
      fromAddress: "noreply@crazyhorsememorial.org",
      transport: transporter
    },
  })

  // Add your own express routes here

  app.listen(3000)
}

start()
