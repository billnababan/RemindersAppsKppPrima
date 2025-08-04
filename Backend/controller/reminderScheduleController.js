const { query } = require("../utils/query")
const WhatsAppService = require("../services/whatsappService")
const dayjs = require("dayjs")
require("dayjs/locale/id")
dayjs.locale("id")

const sendScheduledReminders = async () => {
  try {
    const now = dayjs()
    const currentTime = now.format("HH:mm")
    const currentDay = now.day() // 0 (Minggu) - 6 (Sabtu)
    const currentDate = now.date()

    console.log(`🕐 Checking schedules at ${currentTime}, day: ${currentDay}, date: ${currentDate}`)

    // Ambil schedule yang aktif & cocok dengan waktu
    const schedules = await query(
      `
      SELECT rs.*, r.name as role_name 
      FROM reminder_schedules rs
      LEFT JOIN roles r ON rs.role_id = r.id
      WHERE rs.is_active = 1
        AND rs.schedule_time = ?
        AND (
          rs.schedule_type = 'daily'
          OR (rs.schedule_type = 'weekly' AND rs.schedule_day = ?)
          OR (rs.schedule_type = 'monthly' AND rs.schedule_day = ?)
        )
    `,
      [currentTime, currentDay, currentDate],
    )

    console.log(`📋 Found ${schedules.length} matching schedules`)

    for (const schedule of schedules) {
      console.log(`🔄 Processing schedule: ${schedule.name}`)

      // ✅ PERBAIKAN: Pengecekan duplikasi yang lebih ketat dengan schedule_id
      const today = now.format("YYYY-MM-DD")
      const todayScheduleCheck = await query(
        `
        SELECT COUNT(*) as count FROM reminders 
        WHERE reminder_type = 'scheduled' 
        AND recipient_role_id = ? 
        AND DATE(created_at) = ?
        AND title = ?
        AND JSON_EXTRACT(notes, '$.schedule_id') = ?
      `,
        [schedule.role_id, today, `[Scheduled] ${schedule.name}`, schedule.id.toString()],
      )

      if (todayScheduleCheck[0].count > 0) {
        console.log(`ℹ️ Schedule "${schedule.name}" already executed today (${today}), skipping...`)
        continue
      }

      const users = await query(
        `
        SELECT id, phone_number, full_name FROM users 
        WHERE role_id = ? AND is_active = 1
      `,
        [schedule.role_id],
      )

      console.log(`👥 Found ${users.length} users for role ${schedule.role_name}`)

      if (users.length === 0) {
        console.log(`⚠️ No active users found for role ${schedule.role_name}`)
        continue
      }

      // ✅ PERBAIKAN: Configurable due_date dari schedule
      let dueDate = null
      if (schedule.due_date_days != null && schedule.due_date_time) {
        const datePart = dayjs().add(schedule.due_date_days, "day").format("YYYY-MM-DD")
        dueDate = `${datePart} ${schedule.due_date_time}`
      }

      const reminderData = {
        title: `[Scheduled] ${schedule.name}`,
        message: schedule.reminder_template,
        priority: schedule.priority || "medium",
        reminder_type: "scheduled",
        due_date: dueDate,
      }

      // ✅ PERBAIKAN: Buat reminder untuk setiap user dengan metadata schedule
      let successCount = 0
      for (const user of users) {
        try {
          // ✅ PERBAIKAN: Double check untuk user spesifik dengan schedule_id
          const userReminderCheck = await query(
            `
            SELECT COUNT(*) as count FROM reminders 
            WHERE reminder_type = 'scheduled' 
            AND recipient_id = ?
            AND recipient_role_id = ? 
            AND DATE(created_at) = ?
            AND title = ?
            AND JSON_EXTRACT(notes, '$.schedule_id') = ?
          `,
            [user.id, schedule.role_id, today, `[Scheduled] ${schedule.name}`, schedule.id.toString()],
          )

          if (userReminderCheck[0].count > 0) {
            console.log(`⚠️ User ${user.full_name} already has this reminder today, skipping...`)
            continue
          }

          // ✅ PERBAIKAN: Simpan metadata schedule di notes sebagai JSON
          const notesMetadata = JSON.stringify({
            schedule_id: schedule.id,
            schedule_name: schedule.name,
            created_by_schedule: true,
            execution_date: today,
          })

          // Insert ke database reminder
          const insertResult = await query(
            `
            INSERT INTO reminders (title, message, sender_id, recipient_id, recipient_role_id,
              priority, due_date, reminder_type, is_read, is_completed, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', FALSE, FALSE, ?)
          `,
            [
              reminderData.title,
              reminderData.message,
              process.env.SYSTEM_SENDER_ID || 1,
              user.id,
              schedule.role_id,
              reminderData.priority,
              reminderData.due_date,
              notesMetadata,
            ],
          )

          console.log(`💾 Created reminder ${insertResult.insertId} for ${user.full_name}`)
          successCount++

          // Kirim ke WhatsApp
          if (user.phone_number) {
            await WhatsAppService.sendWhatsApp(user.phone_number, {
              ...reminderData,
              recipient_role: user.full_name,
            })
            console.log(`✅ WhatsApp sent to ${user.full_name} (${user.phone_number})`)
          } else {
            console.log(`⚠️ No phone number for ${user.full_name}`)
          }
        } catch (err) {
          console.error(`❌ Failed to process reminder for ${user.full_name}:`, err.message)
        }
      }

      console.log(`✅ Scheduled reminder "${schedule.name}" sent to ${successCount} users`)
    }
  } catch (error) {
    console.error("❌ Error in scheduled reminder job:", error.message)
  }
}

// Get all reminder schedules
const getReminderSchedules = async (req, res) => {
  try {
    const schedules = await query(`
      SELECT rs.*, r.name as role_name, r.description as role_description
      FROM reminder_schedules rs
      LEFT JOIN roles r ON rs.role_id = r.id
      ORDER BY rs.created_at DESC
    `)

    return res.json({
      success: true,
      schedules,
    })
  } catch (error) {
    console.error("Get reminder schedules error:", error)
    return res.status(500).json({ success: false, error: "Failed to fetch reminder schedules" })
  }
}

// Create new reminder schedule
const createReminderSchedule = async (req, res) => {
  try {
    const {
      name,
      description,
      role_id,
      reminder_template,
      schedule_type,
      schedule_day,
      schedule_time,
      priority = "medium",
      due_date_days,
      due_date_time,
      is_active = true,
    } = req.body

    // Validate required fields
    if (!name || !role_id || !reminder_template || !schedule_type) {
      return res.status(400).json({
        success: false,
        error: "Name, role_id, reminder_template, and schedule_type are required",
      })
    }

    // Validate schedule_type
    if (!["daily", "weekly", "monthly", "custom"].includes(schedule_type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid schedule_type. Must be: daily, weekly, monthly, or custom",
      })
    }

    // Validate priority
    if (!["low", "medium", "high", "urgent"].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: "Invalid priority. Must be: low, medium, high, or urgent",
      })
    }

    // Validate schedule_day for weekly/monthly
    if (schedule_type === "weekly" && (schedule_day < 0 || schedule_day > 6)) {
      return res.status(400).json({
        success: false,
        error: "For weekly schedule, schedule_day must be 0-6 (0=Sunday, 6=Saturday)",
      })
    }

    if (schedule_type === "monthly" && (schedule_day < 1 || schedule_day > 31)) {
      return res.status(400).json({
        success: false,
        error: "For monthly schedule, schedule_day must be 1-31",
      })
    }

    const result = await query(
      `
      INSERT INTO reminder_schedules (
        name, description, role_id, reminder_template, schedule_type,
        schedule_day, schedule_time, priority, due_date_days, due_date_time, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        name,
        description || null,
        role_id,
        reminder_template,
        schedule_type,
        schedule_day || null,
        schedule_time || null,
        priority,
        due_date_days || null,
        due_date_time || null,
        is_active,
      ],
    )

    return res.status(201).json({
      success: true,
      message: "Reminder schedule created successfully",
      schedule_id: result.insertId,
    })
  } catch (error) {
    console.error("Create reminder schedule error:", error)
    return res.status(500).json({ success: false, error: "Failed to create reminder schedule" })
  }
}

// Update reminder schedule
const updateReminderSchedule = async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      description,
      role_id,
      reminder_template,
      schedule_type,
      schedule_day,
      schedule_time,
      priority,
      due_date_days,
      due_date_time,
      is_active,
    } = req.body

    // Check if schedule exists
    const existingSchedule = await query("SELECT * FROM reminder_schedules WHERE id = ?", [id])
    if (!existingSchedule || existingSchedule.length === 0) {
      return res.status(404).json({ success: false, error: "Reminder schedule not found" })
    }

    // Validate schedule_type if provided
    if (schedule_type && !["daily", "weekly", "monthly", "custom"].includes(schedule_type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid schedule_type. Must be: daily, weekly, monthly, or custom",
      })
    }

    // Validate priority if provided
    if (priority && !["low", "medium", "high", "urgent"].includes(priority)) {
      return res.status(400).json({
        success: false,
        error: "Invalid priority. Must be: low, medium, high, or urgent",
      })
    }

    await query(
      `
      UPDATE reminder_schedules SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        role_id = COALESCE(?, role_id),
        reminder_template = COALESCE(?, reminder_template),
        schedule_type = COALESCE(?, schedule_type),
        schedule_day = COALESCE(?, schedule_day),
        schedule_time = COALESCE(?, schedule_time),
        priority = COALESCE(?, priority),
        due_date_days = COALESCE(?, due_date_days),
        due_date_time = COALESCE(?, due_date_time),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `,
      [
        name,
        description,
        role_id,
        reminder_template,
        schedule_type,
        schedule_day,
        schedule_time,
        priority,
        due_date_days,
        due_date_time,
        is_active,
        id,
      ],
    )

    return res.json({
      success: true,
      message: "Reminder schedule updated successfully",
    })
  } catch (error) {
    console.error("Update reminder schedule error:", error)
    return res.status(500).json({ success: false, error: "Failed to update reminder schedule" })
  }
}

// Delete reminder schedule
const deleteReminderSchedule = async (req, res) => {
  try {
    const { id } = req.params

    // Check if schedule exists
    const existingSchedule = await query("SELECT * FROM reminder_schedules WHERE id = ?", [id])
    if (!existingSchedule || existingSchedule.length === 0) {
      return res.status(404).json({ success: false, error: "Reminder schedule not found" })
    }

    await query("DELETE FROM reminder_schedules WHERE id = ?", [id])

    return res.json({
      success: true,
      message: "Reminder schedule deleted successfully",
    })
  } catch (error) {
    console.error("Delete reminder schedule error:", error)
    return res.status(500).json({ success: false, error: "Failed to delete reminder schedule" })
  }
}

// Toggle reminder schedule active status
const toggleReminderSchedule = async (req, res) => {
  try {
    const { id } = req.params

    // Check if schedule exists
    const existingSchedule = await query("SELECT * FROM reminder_schedules WHERE id = ?", [id])
    if (!existingSchedule || existingSchedule.length === 0) {
      return res.status(404).json({ success: false, error: "Reminder schedule not found" })
    }

    const newStatus = !existingSchedule[0].is_active

    await query("UPDATE reminder_schedules SET is_active = ? WHERE id = ?", [newStatus, id])

    return res.json({
      success: true,
      message: `Reminder schedule ${newStatus ? "activated" : "deactivated"} successfully`,
      is_active: newStatus,
    })
  } catch (error) {
    console.error("Toggle reminder schedule error:", error)
    return res.status(500).json({ success: false, error: "Failed to toggle reminder schedule" })
  }
}

module.exports = {
  sendScheduledReminders,
  getReminderSchedules,
  createReminderSchedule,
  updateReminderSchedule,
  deleteReminderSchedule,
  toggleReminderSchedule,
}
