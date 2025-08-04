const { query } = require("../utils/query")
const jwt = require("jsonwebtoken")

const authMiddleware = async (req, res, next) => {
  try {
    // Ambil token dari header atau cookie
    let token = req.header("Authorization")?.replace("Bearer ", "")
    if (!token) {
      token = req.cookies?.token
    }

    const sessionId = req.headers["sessionid"] || req.cookies?.sessionId

    if (!token && !sessionId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please provide token or session.",
      })
    }

    let userId
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        userId = decoded.id
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: "Invalid token.",
        })
      }
    }

    // Ambil data user dari database
    const user = await query(
      `
      SELECT 
        u.id, u.username, u.email, u.phone_number, u.full_name, u.role_id, u.position, u.department, u.created_at,
        r.name AS role_name, r.permissions
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.is_active = 1
      `,
      [userId],
    )
    console.log("Authenticated user:", user)

    if (!user || user.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found or account deactivated.",
      })
    }

    req.user = user[0]
    // console.log("Authenticated user:", req.user)
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
      error: error.message,
    })
  }
}

const checkLevel = (allowedRoleIds = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      })
    }

    const userRoleId = req.user.role_id
    if (!allowedRoleIds.includes(userRoleId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      })
    }

    next()
  }
}

module.exports = {
  authMiddleware,
  checkLevel,
}
