const bcrypt = require("bcryptjs")
const { query } = require("../utils/query")


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
        `SELECT u.id, u.username, u.email, u.phone_number, u.full_name, u.position, u.department, 
                u.is_active, u.last_login, u.created_at, r.name as role_name
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
      res.status(500).json({ error: "Failed to fetch users" })
    }
  }

  // Create new user


const createUser = async (req, res) => {
  const {
    username,
    email,
    phone_number,
    password,
    confPassword,
    full_name,
    role_id,
    position,
    department,
  } = req.body;

  // Debug: Log semua data yang diterima
  console.log("Received data:");
  console.log("username:", username);
  console.log("email:", email);
  console.log("phone_number:", phone_number);
  console.log("phone_number type:", typeof phone_number);
  console.log("full_name:", full_name);
  console.log("role_id:", role_id);
  console.log("position:", position);
  console.log("department:", department);

  // Validasi input required
  if (!username || !email || !password || !full_name || !role_id) {
    return res.status(400).json({ 
      message: "Field yang wajib diisi: username, email, password, full_name, role_id" 
    });
  }

  // Validasi password
  if (password !== confPassword) {
    return res.status(400).json({ message: "Password dan konfirmasi tidak cocok" });
  }

  try {
    // Cek apakah username atau email sudah ada
    const existingUser = await query(
      "SELECT id FROM users WHERE username = ? OR email = ?", 
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Username atau email sudah digunakan" });
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);

    // Proses phone_number dengan benar
    let processedPhoneNumber = null;
    if (phone_number !== undefined && phone_number !== null && phone_number !== '') {
      // Konversi ke string dan bersihkan
      processedPhoneNumber = String(phone_number).trim();
      // Validasi format phone number (opsional)
      if (processedPhoneNumber && !/^[\d\+\-\s\(\)]+$/.test(processedPhoneNumber)) {
        return res.status(400).json({ message: "Format nomor telepon tidak valid" });
      }
    }

    console.log("Processed phone_number:", processedPhoneNumber);

    // Simpan ke database
    const result = await query(
      `INSERT INTO users 
        (username, email, phone_number, password, full_name, role_id, position, department, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        username, 
        email, 
        processedPhoneNumber, 
        hashPassword, 
        full_name, 
        role_id, 
        position || null, 
        department || null
      ]
    );

    console.log("Insert result:", result);

    // Ambil data user yang baru dibuat untuk konfirmasi
    const newUser = await query(
      "SELECT id, username, email, phone_number, full_name, role_id, position, department FROM users WHERE id = ?",
      [result.insertId]
    );

    console.log("Created user:", newUser[0]);

    return res.status(201).json({ 
      message: "User berhasil dibuat",
      user: newUser[0]
    });
  } catch (error) {
    console.error("Error saat membuat user:", error);
    res.status(500).json({ 
      message: "Terjadi kesalahan server", 
      error: error.message 
    });
  }
};




  // Update user
 const updateUser = async (req, res) => {
    try {
      const { id } = req.params
      const { username, email, phone_number, full_name, role_id, position, department, is_active } = req.body

      // Check if username or email already exists (excluding current user)
      const existingUser = await query("SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?", [
        username,
        email,
        id,
      ])

      if (existingUser) {
        return res.status(400).json({ error: "Username or email already exists" })
      }

      await query(
        `UPDATE users SET username = ?, email = ?, phone_number = ?, full_name = ?, role_id = ?, 
                         position = ?, department = ?, is_active = ?, updated_at = NOW() 
         WHERE id = ?`,
        [username, email, phone_number, full_name, role_id, position, department, is_active, id],
      )

    return  res.json({ message: "User updated successfully" })
    } catch (error) {
      console.error("Update user error:", error)
      res.status(500).json({ error: "Failed to update user" })
    }
  }

  // Delete user
 const deleteUser = async (req, res) => {
    try {
      const { id } = req.params

      // Don't allow deleting the current admin user
      if (Number.parseInt(id) === req.user.id) {
        return res.status(400).json({ error: "Cannot delete your own account" })
      }

      await query("DELETE FROM users WHERE id = ?", [id])

      return res.json({ message: "User deleted successfully" })
    } catch (error) {
      console.error("Delete user error:", error)
      res.status(500).json({ error: "Failed to delete user" })
    }
  }

  // Get all roles
 const getRoles= async (req, res) => {
    try {
      const roles = await query("SELECT * FROM roles ORDER BY name")
      res.json({ roles })
    } catch (error) {
      console.error("Get roles error:", error)
      res.status(500).json({ error: "Failed to fetch roles" })
    }
  }

  // Broadcast reminder to all users or specific role
const  broadcastReminder = async (req, res) => {
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
        message: `Reminder broadcast successfully to ${users.length} users`,
        recipients_count: users.length,
      })
    } catch (error) {
      console.error("Broadcast reminder error:", error)
      res.status(500).json({ error: "Failed to broadcast reminder" })
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

      const [documentStats] = await query(`
        SELECT 
          COUNT(*) as total_documents,
          SUM(CASE WHEN status = 'pending_signature' THEN 1 ELSE 0 END) as pending_signatures,
          SUM(CASE WHEN status = 'signed' THEN 1 ELSE 0 END) as signed_documents
        FROM documents
      `)

      res.json({
        users: userStats,
        reminders: reminderStats,
        documents: documentStats,
      })
    } catch (error) {
      console.error("Get system stats error:", error)
      res.status(500).json({ error: "Failed to fetch system statistics" })
    }
  }

  // Reset user password
 const  resetUserPassword = async (req, res) => {
    try {
      const { id } = req.params
      const { new_password } = req.body

      // Hash new password
      const password_hash = await bcrypt.hash(new_password, 10)

      await query("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?", [password_hash, id])

      res.json({ message: "User password reset successfully" })
    } catch (error) {
      console.error("Reset password error:", error)
      res.status(500).json({ error: "Failed to reset user password" })
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
