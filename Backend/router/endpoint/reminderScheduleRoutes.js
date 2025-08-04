const express = require("express")
const { authMiddleware } = require("../../middleware/auth")
const {
  getReminderSchedules,
  createReminderSchedule,
  updateReminderSchedule,
  deleteReminderSchedule,
  toggleReminderSchedule,
} = require("../../controller/reminderScheduleController")

const reminderScheduleRouter = express.Router()

// All routes require authentication and admin/kpho_monitoring role
const adminMiddleware = (req, res, next) => {
  if (!["admin", "kpho_monitoring"].includes(req.user.role_name)) {
    return res.status(403).json({ success: false, error: "Access denied. Admin or KPHO Monitoring role required." })
  }
  next()
}

reminderScheduleRouter.get("/reminder-schedules", authMiddleware, adminMiddleware, getReminderSchedules)
reminderScheduleRouter.post("/reminder-schedules", authMiddleware, adminMiddleware, createReminderSchedule)
reminderScheduleRouter.put("/reminder-schedules/:id", authMiddleware, adminMiddleware, updateReminderSchedule)
reminderScheduleRouter.delete("/reminder-schedules/:id", authMiddleware, adminMiddleware, deleteReminderSchedule)
reminderScheduleRouter.patch("/reminder-schedules/:id/toggle", authMiddleware, adminMiddleware, toggleReminderSchedule)

module.exports = reminderScheduleRouter
