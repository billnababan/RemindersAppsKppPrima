const express = require("express")
const { authMiddleware } = require("../../middleware/auth")
const {
  testWhatsApp,
  sendReminderWhatsApp,
  sendBulkWhatsAppToRole,
  getWhatsAppLogs,
  getWhatsAppStats,
} = require("../../controller/whatsappController")

const whatsappRouter = express.Router()

// Test WhatsApp connection
whatsappRouter.post("/whatsapp/test", authMiddleware, testWhatsApp)

// Send individual reminder via WhatsApp
whatsappRouter.post("/whatsapp/send", authMiddleware, sendReminderWhatsApp)

// Send bulk WhatsApp to role
whatsappRouter.post("/whatsapp/bulk", authMiddleware, sendBulkWhatsAppToRole)

// Get WhatsApp logs
whatsappRouter.get("/whatsapp/logs", authMiddleware, getWhatsAppLogs)

// Get WhatsApp statistics
whatsappRouter.get("/whatsapp/stats", authMiddleware, getWhatsAppStats)

module.exports = whatsappRouter
