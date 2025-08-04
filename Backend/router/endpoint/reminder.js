// routes/reminderRoutes.js
const express = require("express");
const { authMiddleware } = require("../../middleware/auth");
const { 
  getReminders, 
  sendReminder, 
  getReminderId, 
  markAsRead, 
  markAsCompleted, 
  getStats, 
  deleteReminder,
  updateNotes, 
  
} = require("../../controller/reminderController");

const reminderRouter = express.Router();

// PENTING: Urutkan route yang lebih spesifik di atas
reminderRouter.get("/reminders/stats", authMiddleware, getStats);
reminderRouter.get("/reminders/:id", authMiddleware, getReminderId);
reminderRouter.get("/reminders", authMiddleware, getReminders);
reminderRouter.post("/reminders/send", authMiddleware, sendReminder);
reminderRouter.post("/reminders", authMiddleware, sendReminder); // Alternative endpoint
reminderRouter.patch("/reminders/:id/read", authMiddleware, markAsRead);
reminderRouter.patch("/reminders/:id/complete", authMiddleware, markAsCompleted);
reminderRouter.patch("/reminders/:id/notes", authMiddleware, updateNotes);
reminderRouter.delete("/reminders/:id", authMiddleware, deleteReminder);

module.exports = reminderRouter;