const cron = require("node-cron")
const { query } = require("../utils/query")
const WhatsAppService = require("./whatsappService")

const SYSTEM_SENDER_ID = process.env.SYSTEM_SENDER_ID || 1

// Function to send scheduled WhatsApp reminders
const sendScheduledWhatsAppReminders = async () => {
  try {
    console.log("🔄 Running scheduled WhatsApp reminder check...")

    const today = new Date()
    const currentDay = today.getDate()
    const currentDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const currentTime = today.toTimeString().slice(0, 5) // HH:MM format

    // Get active reminder schedules
    const schedules = await query(`
      SELECT rs.*, r.name as role_name
      FROM reminder_schedules rs
      JOIN roles r ON rs.role_id = r.id
      WHERE rs.is_active = TRUE
    `)

    for (const schedule of schedules) {
      let shouldSendReminder = false

      // Check if it's time to send based on schedule type
      if (schedule.schedule_type === "daily") {
        shouldSendReminder = true
      } else if (schedule.schedule_type === "weekly" && currentDayOfWeek === schedule.schedule_day) {
        shouldSendReminder = true
      } else if (schedule.schedule_type === "monthly" && currentDay === schedule.schedule_day) {
        shouldSendReminder = true
      }

      // Check if it's the right time (if schedule_time is set)
      if (shouldSendReminder && schedule.schedule_time) {
        const scheduleTime = schedule.schedule_time.slice(0, 5) // HH:MM format
        if (currentTime !== scheduleTime) {
          shouldSendReminder = false
        }
      }

      if (shouldSendReminder) {
        // Check if reminder already sent today for this schedule
        const existingReminder = await query(
          `
          SELECT id FROM reminders
          WHERE reminder_type = 'automatic'
          AND recipient_role_id = ?
          AND DATE(created_at) = CURDATE()
          AND title LIKE ?
        `,
          [schedule.role_id, `%${schedule.name}%`],
        )

        if (existingReminder.length === 0) {
          // Get all active users in this role
          const users = await query(
            `
            SELECT id, full_name, phone_number
            FROM users
            WHERE role_id = ? AND is_active = TRUE
          `,
            [schedule.role_id],
          )

          for (const user of users) {
            // Create reminder in database
            const reminderTitle = `${schedule.name} - ${today.toLocaleDateString("id-ID")}`

            const result = await query(
              `
              INSERT INTO reminders (
                title, message, sender_id, recipient_id, recipient_role_id,
                reminder_type, priority, scheduled_date, is_read, is_completed, notes
              ) VALUES (?, ?, ?, ?, ?, 'automatic', 'medium', CURDATE(), FALSE, FALSE, '')
            `,
              [reminderTitle, schedule.reminder_template, SYSTEM_SENDER_ID, user.id, schedule.role_id],
            )

            // Send WhatsApp if user has phone number
            if (user.phone_number) {
              try {
                const whatsappResult = await WhatsAppService.sendWhatsApp(user.phone_number, {
                  title: reminderTitle,
                  message: schedule.reminder_template,
                  priority: "medium",
                  reminder_type: "automatic",
                  due_date: null,
                })

                console.log(`✅ WhatsApp sent to ${user.full_name} (${user.phone_number}):`, whatsappResult)
              } catch (whatsappError) {
                console.error(`❌ Failed to send WhatsApp to ${user.full_name}:`, whatsappError.message)
              }
            } else {
              console.log(`⚠️ No phone number for user: ${user.full_name}`)
            }
          }

          console.log(`✅ Automatic reminder sent for schedule: ${schedule.name} to ${users.length} users`)
        } else {
          console.log(`ℹ️ Reminder already sent today for schedule: ${schedule.name}`)
        }
      }
    }

    console.log("✅ Scheduled WhatsApp reminder check completed")
  } catch (error) {
    console.error("❌ Error in scheduled WhatsApp reminders:", error)
  }
}

// Initialize scheduler
const initializeWhatsAppScheduler = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", sendScheduledWhatsAppReminders, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  })

  // Also run every 15 minutes for more frequent checks
  cron.schedule("*/15 * * * *", sendScheduledWhatsAppReminders, {
    scheduled: true,
    timezone: "Asia/Jakarta",
  })

  console.log("📅 WhatsApp scheduler initialized - running every 15 minutes")
}

module.exports = {
  initializeWhatsAppScheduler,
  sendScheduledWhatsAppReminders,
}
