// controller/userController.js
const bcrypt = require("bcryptjs")
const { query } = require("../../utils/query")

// Get all users
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role = "all", status = "all" } = req.query
    const offset = (page - 1) * limit
    let whereClause = "WHERE 1=1"
    const params = []

    if (role !== "all") {
      whereClause += " AND r.name = ?"
      params.push(role)
    }

    if (status !== "all") {
      whereClause += " AND u.is_active = ?"
      params.push(status === "active")
    }

    const users = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.position, u.department,
               u.is_active, u.last_login, u.created_at, u.role_id, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number.parseInt(limit), offset],
    )

    // Get total count
    const [{ total }] = await query(
      `SELECT COUNT(*) as total FROM users u LEFT JOIN roles r ON u.role_id = r.id ${whereClause}`,
      params,
    )

    res.json({
      success: true,
      users,
      pagination: {
        current_page: Number.parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ success: false, error: "Failed to fetch users" })
  }
}

// Create new user - PERBAIKAN UTAMA
const createUser = async (req, res) => {
  try {
    const { username, email, password, full_name, role_id, position, department } = req.body

    console.log("Creating user with data:", { username, email, full_name, role_id })

    // Validasi input
    if (!username || !email || !password || !full_name || !role_id) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing required fields: username, email, password, full_name, role_id" 
      })
    }

    // Check if username or email already exists - PERBAIKAN
    const existingUsers = await query(
      "SELECT id, username, email FROM users WHERE username = ? OR email = ?", 
      [username, email]
    )
    
    console.log("Existing users check:", existingUsers)

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0]
      const conflictField = existingUser.username === username ? 'username' : 'email'
      return res.status(400).json({ 
        success: false, 
        error: `${conflictField} already exists` 
      })
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10)

    // Insert new user
    const result = await query(
      `INSERT INTO users (username, email, password_hash, full_name, role_id, position, department, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [username, email, password_hash, full_name, role_id, position || null, department || null],
    )

    console.log("User created successfully:", result)

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user_id: result.insertId,
    })
  } catch (error) {
    console.error("Create user error:", error)
    res.status(500).json({ success: false, error: "Failed to create user", details: error.message })
  }
}

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { username, email, phone_number, full_name, role_id, position, department, is_active } = req.body

    // Check if username or email already exists (excluding current user)
    const existingUsers = await query(
      "SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?", 
      [username, email, id]
    )

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({ success: false, error: "Username or email already exists" })
    }

    await query(
      `UPDATE users SET username = ?, email = ?, phone_number = ?, full_name = ?, role_id = ?,
                        position = ?, department = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?`,
      [username, email, phone_number, full_name, role_id, position, department, is_active, id],
    )

    return res.json({ success: true, message: "User updated successfully" })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ success: false, error: "Failed to update user" })
  }
}

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    // Don't allow deleting the current admin user
    if (Number.parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, error: "Cannot delete your own account" })
    }

    await query("DELETE FROM users WHERE id = ?", [id])
    res.json({ success: true, message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ success: false, error: "Failed to delete user" })
  }
}

// Get all roles
const getRoles = async (req, res) => {
  try {
    const roles = await query("SELECT * FROM roles ORDER BY name")
    res.json({ success: true, roles })
  } catch (error) {
    console.error("Get roles error:", error)
    res.status(500).json({ success: false, error: "Failed to fetch roles" })
  }
}

// Broadcast reminder to all users or specific role
const broadcastReminder = async (req, res) => {
  try {
    const { title, message, priority = "medium", due_date, recipient_role_id } = req.body

    let users = []
    if (recipient_role_id) {
      // Send to specific role
      users = await query("SELECT id FROM users WHERE role_id = ? AND is_active = TRUE", [recipient_role_id])
    } else {
      // Send to all active users
      users = await query("SELECT id FROM users WHERE is_active = TRUE")
    }

    // Insert reminders for all users
    const reminderPromises = users.map((user) =>
      query(
        `INSERT INTO reminders (title, message, sender_id, recipient_id, recipient_role_id,
                                priority, due_date, reminder_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'manual')`,
        [title, message, req.user.id, user.id, recipient_role_id, priority, due_date],
      ),
    )

    await Promise.all(reminderPromises)

    res.json({
      success: true,
      message: `Reminder broadcast successfully to ${users.length} users`,
      recipients_count: users.length,
    })
  } catch (error) {
    console.error("Broadcast reminder error:", error)
    res.status(500).json({ success: false, error: "Failed to broadcast reminder" })
  }
}

// Get system statistics
const getSystemStats = async (req, res) => {
  try {
    const [userStats] = await query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_logins
      FROM users
    `)

    const [reminderStats] = await query(`
      SELECT 
        COUNT(*) as total_reminders,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_reminders,
        SUM(CASE WHEN is_completed = FALSE THEN 1 ELSE 0 END) as pending_reminders,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_reminders
      FROM reminders
    `)

    res.json({
      success: true,
      users: userStats,
      reminders: reminderStats,
    })
  } catch (error) {
    console.error("Get system stats error:", error)
    res.status(500).json({ success: false, error: "Failed to fetch system statistics" })
  }
}

// Reset user password
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params
    const { new_password } = req.body

    // Hash new password
    const password_hash = await bcrypt.hash(new_password, 10)

    await query("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?", [password_hash, id])

    res.json({ success: true, message: "User password reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ success: false, error: "Failed to reset user password" })
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  broadcastReminder,
  getSystemStats,
  resetUserPassword
}