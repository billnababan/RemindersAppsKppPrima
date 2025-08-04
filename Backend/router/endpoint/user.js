// routes/userRoutes.js
const express = require("express");
const { authMiddleware, checkLevel } = require("../../middleware/auth");
const { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getRoles, 
  broadcastReminder, 
  getSystemStats, 
  resetUserPassword 
} = require("../../controller/auth/user");

const userRouter = express.Router();

// Admin routes
userRouter.get("/users", authMiddleware, checkLevel([1]), getUsers);
userRouter.post("/users", authMiddleware, checkLevel([1]), createUser);
userRouter.put("/users/:id", authMiddleware, checkLevel([1]), updateUser);
userRouter.delete("/users/:id", authMiddleware, checkLevel([1]), deleteUser);
userRouter.post("/users/:id/reset-password", authMiddleware, checkLevel([1]), resetUserPassword);

// Roles and stats
userRouter.get("/roles", authMiddleware, getRoles);
userRouter.get("/stats", authMiddleware, checkLevel([1]), getSystemStats);
userRouter.post("/broadcast-reminder", authMiddleware, checkLevel([1]), broadcastReminder);

module.exports = userRouter;