import express from 'express'
// import express = require('express') // avoiding TS1259
import accesslogRoutes from './app/routes/accessLogsRoutes'
import usersInRoomRoutes from './app/routes/usersInRoomRoutes'
import { setupBeebotte } from './app/slack/in-beebotte'
import { amsOptions } from './config'

const app: express.Express = express()

// parse requests of content-type - application/json
app.use(express.json())

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))

// simple route
app.get('/', (_req, res) => {
  res.json({ message: 'This is backend server.' })
})

// set middlewares
app.use('/v1', accesslogRoutes, usersInRoomRoutes)

// set port, listen for requests
const PORT = amsOptions.port
app.listen(PORT, () => {
  console.log(`[*] Server is running on port ${PORT}.`)
})

const boushitsuBot = amsOptions.enable_boushitsu ?? false // default off
if (boushitsuBot) {
  if (amsOptions.beebotte_channel &&
    amsOptions.beebotte_channel_token &&
    amsOptions.beebotte_resource) {
    // subscribe the beebotte channel, and wait for message.
    setupBeebotte()
  } else {
    console.error('[!] Boushitsu Slackbot falied to start due to lack of properties.')
  }
}
