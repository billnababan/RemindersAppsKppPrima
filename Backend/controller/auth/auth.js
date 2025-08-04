const { query } = require("../../utils/query")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    if (!req.user || req.user.role_name !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Only admin can view all users." })
    }

    const users = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role_id, r.name AS role_name, u.position, u.department, u.created_at, u.last_login, u.is_active
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id`,
    )

    res.status(200).json({ success: true, message: "Users retrieved successfully", users })
  } catch (error) {
    console.error("Error in getAllUsers:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}

// Get current user's role
const getUserRole = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not authenticated" })
    }

    res.status(200).json({ success: true, role: req.user.role_name })
  } catch (error) {
    console.error("Error in getUserRole:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}

// Login user
// Login user
const Login = async (req, res) => {
  const { email, password } = req.body
  console.log("Login request body:", req.body)

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" })
    }

    const users = await query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.role_id, u.position, u.department, r.name AS role_name, r.permissions
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.is_active = 1`,
      [email],
    )

    if (!users || users.length === 0) {
      return res.status(400).json({ success: false, message: "Email doesn't exist or user is inactive" })
    }

    const user = users[0]
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password" })
    }

    // Update last login
    await query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id])

    const payload = {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
    }

    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" })

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })

    // Parse permissions safely
    let parsedPermissions = []
    if (user.permissions) {
      try {
        parsedPermissions = JSON.parse(user.permissions)
      } catch (err) {
        parsedPermissions = [user.permissions] // fallback if not JSON array
      }
    }

    // Return user data in correct format
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      position: user.position,
      department: user.department,
      role_name: user.role_name,
      permissions: parsedPermissions,
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: userData,
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}


// Register new user (admin only)
const register = async (req, res) => {
  const { username, email, password, confPassword, full_name, role_id, position, department } = req.body

  try {
    if (!email || !password || !confPassword || !role_id || !full_name || !username) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" })
    }

    if (password !== confPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" })
    }

    const existing = await query("SELECT id FROM users WHERE email = ?", [email])
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Email already exists" })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await query(
      `INSERT INTO users (username, email, password_hash, full_name, role_id, position, department, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [username, email, hashedPassword, full_name, role_id, position, department, 1],
    )

    res.status(201).json({ success: true, message: "User registered successfully" })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({ success: false, message: "Registration failed" })
  }
}

// Logout
const Logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
    })
    res.status(200).json({ success: true, message: "Logout successful" })
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to logout" })
  }
}

// Update user role (admin only)
const updateUserRole = async (req, res) => {
  const { id } = req.params
  const { role_id } = req.body

  try {
    if (!req.user || req.user.role_name !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Only admin can update user roles." })
    }

    const role = await query("SELECT id FROM roles WHERE id = ?", [role_id])
    if (!role || role.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid role_id" })
    }

    const user = await query("SELECT id FROM users WHERE id = ?", [id])
    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    await query("UPDATE users SET role_id = ?, updated_at = NOW() WHERE id = ?", [role_id, id])

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: { id, role_id },
    })
  } catch (error) {
    console.error("updateUserRole error:", error)
    res.status(500).json({ success: false, message: "Internal server error" })
  }
}

// Get profile
const getProfile = async (req, res) => {
  try {
    const users = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.position, u.department,
               u.last_login, u.created_at, r.name as role_name, r.permissions
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id],
    )

    if (!users || users.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = users[0]

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        position: user.position,
        department: user.department,
        last_login: user.last_login,
        created_at: user.created_at,
        role_name: user.role_name,
        permissions: (() => {
          if (!user.permissions) return []
          try {
            return JSON.parse(user.permissions)
          } catch {
            return [user.permissions]
          }
        })(),
      },
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    res.status(500).json({ error: "Failed to fetch profile" })
  }
}


// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { full_name, email, phone_number, position, department } = req.body
    const userId = req.user.id

    await query(
      `UPDATE users SET full_name = ?, email = ?, phone_number = ?, position = ?, department = ?, updated_at = NOW()
       WHERE id = ?`,
      [full_name, email, phone_number, position, department, userId],
    )

    // Get updated user data
    const users = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.position, u.department,
               r.name as role_name, r.permissions
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [userId],
    )

    const user = users[0]

    // Parse permissions safely
    let parsedPermissions = []
    if (user.permissions) {
      try {
        parsedPermissions = JSON.parse(user.permissions)
      } catch {
        parsedPermissions = [user.permissions]
      }
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        position: user.position,
        department: user.department,
        role_name: user.role_name,
        permissions: parsedPermissions,
      },
    })
  } catch (error) {
    console.error("Profile update error:", error)
    res.status(500).json({ error: "Failed to update profile" })
  }
}


// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    // Get current user
    const users = await query("SELECT password_hash FROM users WHERE id = ?", [userId])
    if (!users || users.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    const user = users[0]

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValidPassword) {
      return res.status(400).json({ error: "Current password is incorrect" })
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    await query("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?", [newPasswordHash, userId])

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ error: "Failed to change password" })
  }
}

module.exports = {
  getAllUsers,
  getUserRole,
  Login,
  register,
  Logout,
  updateUserRole,
  getProfile,
  updateProfile,
  changePassword,
}
