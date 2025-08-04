// routes/notificationRoutes.js
const express = require("express");
const { authMiddleware } = require("../../middleware/auth"); // Assuming your auth middleware is here
const { getNotifications } = require("../../controller/notificationController");

const notificationRouter = express.Router();

notificationRouter.get("/notifications", authMiddleware, getNotifications);

module.exports = notificationRouter;