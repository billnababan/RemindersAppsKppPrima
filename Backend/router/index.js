const express = require("express")
const authRouter = require("./endpoint/auth.js")
const reminderRouter = require("./endpoint/reminder.js")
const adminRouter = require("./endpoint/admin.js")
const documentsRouter = require("./endpoint/document.js")
const esignRouter = require("./endpoint/esign.js")
const whatsappRouter = require("./endpoint/whatsapp.js")
const userRouter = require("./endpoint/user.js")
const notificationRouter = require("./endpoint/notificationRoutes.js")
const reminderScheduleRouter = require("./endpoint/reminderScheduleRoutes.js")
const Router = express.Router()

const api = "/api/v1"

Router.use(api, authRouter)
Router.use(api, userRouter)
Router.use(api, reminderRouter)
Router.use(api, reminderScheduleRouter)
Router.use(api, adminRouter)
Router.use(api, documentsRouter)
Router.use(api, esignRouter)
Router.use(api, whatsappRouter)
Router.use(api, notificationRouter)


module.exports = Router
