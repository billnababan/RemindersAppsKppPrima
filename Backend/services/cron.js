const cron = require("node-cron")
const { sendScheduledReminders } = require("../controller/reminderScheduleController")

// Jalankan setiap menit
cron.schedule("* * * * *", () => {
  console.log("⏰ Mengecek dan mengirim reminder otomatis...")
  sendScheduledReminders()
})
