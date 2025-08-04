const { query } = require("../utils/query")
const SYSTEM_SENDER_ID = process.env.SYSTEM_SENDER_ID || 1
const WhatsAppService = require("../services/whatsappService")

// ✅ PERBAIKAN: Helper function untuk parse notes JSON
const parseNotesMetadata = (notes) => {
  try {
    if (!notes) return null
    // Cek apakah notes adalah JSON
    if (notes.startsWith("{") && notes.endsWith("}")) {
      return JSON.parse(notes)
    }
    return null
  } catch (error) {
    return null
  }
}

// Get reminders for current user - PERBAIKAN ANTI DUPLIKASI
const getReminders = async (req, res) => {
  try {
    console.log("Reminder Fetch — user.id:", req.user.id)
    console.log("Reminder Fetch — user.role_id:", req.user.role_id)
    const { page = 1, limit = 10, status = "all", type = "all", priority = "all", search = "" } = req.query

    const offset = (page - 1) * limit
    let whereClause = ""
    const params = []

    if (["admin", "kpho_monitoring"].includes(req.user.role_name)) {
      // ✅ PERBAIKAN: Admin melihat scheduled reminders yang di-group (tidak duplikat)
      whereClause = `WHERE (
        r.reminder_type != 'scheduled' 
        OR (r.reminder_type = 'scheduled' AND r.recipient_id = (
          SELECT MIN(recipient_id) FROM reminders r2 
          WHERE r2.reminder_type = 'scheduled' 
          AND r2.recipient_role_id = r.recipient_role_id 
          AND DATE(r2.created_at) = DATE(r.created_at)
          AND r2.title = r.title
        ))
      )`
    } else {
      // ✅ PERBAIKAN: User biasa hanya lihat reminder mereka sendiri
      whereClause = "WHERE r.recipient_id = ?"
      params.push(req.user.id)
    }

    if (status !== "all") {
      if (status === "unread") {
        whereClause += " AND r.is_read = FALSE"
      } else if (status === "completed") {
        whereClause += " AND r.is_completed = TRUE"
      } else if (status === "pending") {
        whereClause += " AND r.is_completed = FALSE"
      }
    }

    if (type !== "all") {
      whereClause += " AND r.reminder_type = ?"
      params.push(type)
    }

    if (priority !== "all") {
      whereClause += " AND r.priority = ?"
      params.push(priority)
    }

    if (search && search.trim() !== "") {
      whereClause += " AND (r.title LIKE ? OR r.message LIKE ?)"
      params.push(`%${search}%`, `%${search}%`)
    }

    const reminders = await query(
      `SELECT r.*,
             u.full_name as sender_name, u.position as sender_position,
            d.title as document_title, d.file_name as document_file, d.file_path as document_path,
            (CASE 
              WHEN r.reminder_type = 'scheduled' THEN (
                SELECT COUNT(*) FROM reminders r3 
                WHERE r3.reminder_type = 'scheduled' 
                AND r3.recipient_role_id = r.recipient_role_id 
                AND DATE(r3.created_at) = DATE(r.created_at)
                AND r3.title = r.title
              )
              ELSE 1 
            END) as total_recipients
     FROM reminders r
     LEFT JOIN users u ON r.sender_id = u.id
     LEFT JOIN documents d ON r.document_id = d.id
     ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
      [...params, Number.parseInt(limit), offset],
    )

    // ✅ PERBAIKAN: Process reminders untuk menambah metadata
    const processedReminders = reminders.map((reminder) => {
      const metadata = parseNotesMetadata(reminder.notes)

      // Jika ini scheduled reminder dan ada metadata, tampilkan info tambahan
      if (reminder.reminder_type === "scheduled" && metadata?.created_by_schedule) {
        return {
          ...reminder,
          notes: "", // Kosongkan notes untuk UI (metadata tidak perlu ditampilkan)
          schedule_metadata: metadata,
          display_title: `${reminder.title} (${reminder.total_recipients} recipients)`,
        }
      }

      return reminder
    })

    const [{ total }] = await query(`SELECT COUNT(*) as total FROM reminders r ${whereClause}`, params)

    return res.json({
      success: true,
      reminders: processedReminders,
      pagination: {
        current_page: Number.parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: Number.parseInt(limit),
      },
    })
  } catch (error) {
    console.error("Get reminders error:", error)
    return res.status(500).json({ success: false, error: "Failed to fetch reminders" })
  }
}

// Send reminder - PERBAIKAN
const sendReminder = async (req, res) => {
  try {
    const { title, message, recipient_id, recipient_role_id, priority = "medium", due_date, document_id } = req.body

    if (!recipient_id && !recipient_role_id) {
      return res.status(400).json({ success: false, error: "Either recipient_id or recipient_role_id is required" })
    }

    // ✅ PERBAIKAN: Jika kirim ke role, buat reminder untuk setiap user di role tersebut
    if (recipient_role_id) {
      // Get all users in the role
      const users = await query("SELECT id, phone_number, full_name FROM users WHERE role_id = ? AND is_active = 1", [
        recipient_role_id,
      ])

      if (users.length === 0) {
        return res.status(404).json({ success: false, error: "No active users found in this role" })
      }

      const reminderIds = []
      const whatsappResults = []

      // Create reminder for each user in the role
      for (const user of users) {
        const result = await query(
          `INSERT INTO reminders (title, message, sender_id, recipient_id, recipient_role_id,
                                 priority, due_date, document_id, reminder_type, is_read, is_completed, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', FALSE, FALSE, '')`,
          [title, message, req.user.id, user.id, recipient_role_id, priority, due_date, document_id],
        )

        reminderIds.push(result.insertId)

        // Send WhatsApp to each user
        if (user.phone_number) {
          try {
            const whatsappResult = await WhatsAppService.sendWhatsApp(user.phone_number, {
              title,
              message,
              priority,
              reminder_type: "manual",
              due_date,
              recipient_role: user.full_name,
            })
            whatsappResults.push({
              user: user.full_name,
              phone: user.phone_number,
              success: true,
              messageId: whatsappResult.messageId,
            })
            console.log(`✅ WhatsApp sent to ${user.full_name} (${user.phone_number})`)
          } catch (err) {
            whatsappResults.push({
              user: user.full_name,
              phone: user.phone_number,
              success: false,
              error: err.message,
            })
            console.error(`❌ Failed to send WhatsApp to ${user.full_name}:`, err.message)
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: `Reminder sent to ${users.length} users in the role`,
        reminder_ids: reminderIds,
        whatsapp_results: whatsappResults,
      })
    } else {
      // Single user reminder (existing logic)
      const result = await query(
        `INSERT INTO reminders (title, message, sender_id, recipient_id, recipient_role_id,
                               priority, due_date, document_id, reminder_type, is_read, is_completed, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', FALSE, FALSE, '')`,
        [title, message, req.user.id, recipient_id, recipient_role_id, priority, due_date, document_id],
      )

      let whatsappResult = null

      // Send WhatsApp if recipient_id exists
      if (recipient_id) {
        const [user] = await query("SELECT phone_number, full_name, username FROM users WHERE id = ?", [recipient_id])
        if (user?.phone_number) {
          try {
            whatsappResult = await WhatsAppService.sendWhatsApp(user.phone_number, {
              title,
              message,
              priority,
              reminder_type: "manual",
              due_date,
              recipient_role: user.full_name,
            })
            console.log("✅ WhatsApp reminder result:", whatsappResult)
          } catch (err) {
            console.error("❌ Failed to send WhatsApp:", err.message)
          }
        } else {
          console.log("⚠️ User phone number not found for ID:", recipient_id)
        }
      }

      return res.status(201).json({
        success: true,
        message: "Reminder sent successfully",
        reminder_id: result.insertId,
        whatsapp_sent: whatsappResult?.success || false,
        whatsapp_detail: whatsappResult?.detail || null,
      })
    }
  } catch (error) {
    console.error("Send reminder error:", error)
    res.status(500).json({ success: false, error: "Failed to send reminder" })
  }
}

// Get single reminder
const getReminderId = async (req, res) => {
  try {
    const { id } = req.params

    let baseQuery = `
      SELECT r.*,
             u.full_name as sender_name, u.position as sender_position, u.email as sender_email,
            d.title as document_title, d.file_name as document_file, d.file_path as document_path
     FROM reminders r
     LEFT JOIN users u ON r.sender_id = u.id
     LEFT JOIN documents d ON r.document_id = d.id
     WHERE r.id = ?
    `

    const params = [id]

    if (!["admin", "kpho_monitoring"].includes(req.user.role_name)) {
      // batasi untuk role biasa
      baseQuery += ` AND r.recipient_id = ?`
      params.push(req.user.id)
    }

    const reminder = await query(baseQuery, params)

    if (!reminder || reminder.length === 0) {
      return res.status(404).json({ success: false, error: "Reminder not found or access denied" })
    }

    return res.json({ success: true, reminder: reminder[0] })
  } catch (error) {
    console.error("Get reminder error:", error)
    res.status(500).json({ success: false, error: "Failed to fetch reminder" })
  }
}

// Mark reminder as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params

    const reminder = await query("SELECT * FROM reminders WHERE id = ? AND recipient_id = ?", [id, req.user.id])

    if (!reminder || reminder.length === 0) {
      return res.status(404).json({ success: false, error: "Reminder not found or access denied" })
    }

    await query("UPDATE reminders SET is_read = TRUE WHERE id = ?", [id])

    return res.json({ success: true, message: "Reminder marked as read" })
  } catch (error) {
    console.error("Mark read error:", error)
    res.status(500).json({ success: false, error: "Failed to mark reminder as read" })
  }
}

// Mark reminder as completed - UPDATED WITH NOTES
const markAsCompleted = async (req, res) => {
  try {
    const { id } = req.params
    const { notes = "" } = req.body

    const reminder = await query("SELECT * FROM reminders WHERE id = ? AND recipient_id = ?", [id, req.user.id])

    if (!reminder || reminder.length === 0) {
      return res.status(404).json({ success: false, error: "Reminder not found or access denied" })
    }

    // ✅ PERBAIKAN: Preserve metadata jika ada
    const existingMetadata = parseNotesMetadata(reminder[0].notes)
    let finalNotes = notes

    if (existingMetadata) {
      // Jika ada metadata, gabungkan dengan notes user
      finalNotes = JSON.stringify({
        ...existingMetadata,
        user_notes: notes,
        completed_at: new Date().toISOString(),
      })
    }

    await query("UPDATE reminders SET is_completed = TRUE, is_read = TRUE, notes = ? WHERE id = ?", [finalNotes, id])

    return res.json({ success: true, message: "Reminder marked as completed" })
  } catch (error) {
    console.error("Mark complete error:", error)
    res.status(500).json({ success: false, error: "Failed to mark reminder as completed" })
  }
}

// Update notes endpoint - PERBAIKAN
const updateNotes = async (req, res) => {
  try {
    const { id } = req.params
    const { notes } = req.body

    if (!notes || notes.trim() === "") {
      return res.status(400).json({ success: false, error: "Notes cannot be empty" })
    }

    const reminder = await query("SELECT * FROM reminders WHERE id = ? AND recipient_id = ?", [id, req.user.id])

    if (!reminder || reminder.length === 0) {
      return res.status(404).json({ success: false, error: "Reminder not found or access denied" })
    }

    // ✅ PERBAIKAN: Preserve metadata jika ada
    const existingMetadata = parseNotesMetadata(reminder[0].notes)
    let finalNotes = notes.trim()

    if (existingMetadata) {
      // Jika ada metadata, gabungkan dengan notes user
      finalNotes = JSON.stringify({
        ...existingMetadata,
        user_notes: notes.trim(),
        updated_at: new Date().toISOString(),
      })
    }

    await query("UPDATE reminders SET notes = ? WHERE id = ?", [finalNotes, id])

    return res.json({ success: true, message: "Notes updated successfully" })
  } catch (error) {
    console.error("Update notes error:", error)
    res.status(500).json({ success: false, error: "Failed to update notes" })
  }
}

// Get reminder statistics
const getStats = async (req, res) => {
  try {
    const userId = req.user.id
    const roleId = req.user.role_id
    const roleName = req.user.role_name

    let whereClause = ""
    let params = []

    if (["admin", "kpho_monitoring"].includes(roleName)) {
      // Admin dan KPHO Monitoring bisa lihat semua data (tanpa duplikasi scheduled)
      whereClause = `WHERE (
        reminder_type != 'scheduled' 
        OR (reminder_type = 'scheduled' AND recipient_id = (
          SELECT MIN(recipient_id) FROM reminders r2 
          WHERE r2.reminder_type = 'scheduled' 
          AND r2.recipient_role_id = reminders.recipient_role_id 
          AND DATE(r2.created_at) = DATE(reminders.created_at)
          AND r2.title = reminders.title
        ))
      )`
    } else {
      // User biasa hanya lihat berdasarkan id mereka
      whereClause = "WHERE recipient_id = ?"
      params = [userId]
    }

    const stats = await query(
      `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread,
       SUM(CASE WHEN is_completed = FALSE THEN 1 ELSE 0 END) as pending,
       SUM(CASE WHEN is_completed = TRUE THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN priority = 'urgent' AND is_completed = FALSE THEN 1 ELSE 0 END) as urgent
      FROM reminders
      ${whereClause}`,
      params,
    )

    const safeStats = stats[0] || {}

    return res.json({
      success: true,
      total: safeStats.total || 0,
      unread: safeStats.unread || 0,
      pending: safeStats.pending || 0,
      completed: safeStats.completed || 0,
      urgent: safeStats.urgent || 0,
    })
  } catch (error) {
    console.error("Get stats error:", error)
    return res.status(500).json({ success: false, error: "Failed to fetch statistics" })
  }
}

// Delete reminder
const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params

    const reminder = await query("SELECT * FROM reminders WHERE id = ? AND sender_id = ?", [id, req.user.id])

    if ((!reminder || reminder.length === 0) && req.user.role_name !== "admin") {
      return res.status(404).json({ success: false, error: "Reminder not found or access denied" })
    }

    await query("DELETE FROM reminders WHERE id = ?", [id])

    return res.json({ success: true, message: "Reminder deleted successfully" })
  } catch (error) {
    console.error("Delete reminder error:", error)
    return res.status(500).json({ success: false, error: "Failed to delete reminder" })
  }
}

module.exports = {
  getReminders,
  getReminderId,
  sendReminder,
  markAsRead,
  markAsCompleted,
  updateNotes,
  getStats,
  deleteReminder,
}
