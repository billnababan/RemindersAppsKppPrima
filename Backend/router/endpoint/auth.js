const express = require("express")
const {
  register,
  Login,
  Logout,
  getUserRole,
  getAllUsers,
  updateUserRole,
  getProfile,
  updateProfile,
  changePassword,
} = require("../../controller/auth/auth")
const { authMiddleware } = require("../../middleware/auth")

const authRouter = express.Router()

// Public routes
authRouter.post("/register", register)
authRouter.post("/login", Login)
authRouter.post("/logout", Logout)

// Protected routes
authRouter.get("/users/role", authMiddleware, getUserRole)
authRouter.get("/users", authMiddleware, getAllUsers)
authRouter.get("/profile", authMiddleware, getProfile)
authRouter.put("/profile", authMiddleware, updateProfile)
authRouter.put("/change-password", authMiddleware, changePassword)
authRouter.put("/users/:id/role", authMiddleware, updateUserRole)

module.exports = authRouter
