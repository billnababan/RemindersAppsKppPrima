const express = require("express")

const { createUser, getUsers, updateUser, deleteUser, getRoles, broadcastReminder, getSystemStats, resetUserPassword } = require("../../controller/adminController")
const { authMiddleware } = require("../../middleware/auth")

const adminRouter = express.Router()



// User management
adminRouter.get("/users", authMiddleware, getUsers)
adminRouter.post("/users", authMiddleware, createUser)
adminRouter.put("/users/:id", authMiddleware, updateUser)
adminRouter.delete("/users/:id", authMiddleware, deleteUser)
adminRouter.get("/roles", authMiddleware, getRoles)
adminRouter.post("/broadcast-reminder", authMiddleware, broadcastReminder)
adminRouter.get("/stats", authMiddleware, getSystemStats)

adminRouter.post("/users/:id/reset-password", authMiddleware, resetUserPassword)
  

module.exports = adminRouter
