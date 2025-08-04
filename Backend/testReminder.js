// Script untuk test WhatsApp service secara langsung
const WhatsAppService = require("./services/whatsappService")

async function testWhatsAppService() {
  try {
    console.log("🧪 Testing WhatsApp service...")

    // Test data
    const testData = {
      title: "[TEST] Reminder Test",
      message: "Ini adalah pesan test untuk memastikan deadline muncul",
      priority: "medium",
      reminder_type: "scheduled",
      due_date: "2025-08-15 14:30:00", // Format MySQL DATETIME
      recipient_role: "Test User",
    }

    console.log("📋 Test data:", testData)

    // Format pesan tanpa kirim
    const formattedMessage = WhatsAppService.formatKPPMessage(testData)
    console.log("\n📝 Formatted message:")
    console.log(formattedMessage)

    // Uncomment untuk test kirim ke nomor tertentu
    // const phoneNumber = "6281234567890" // Ganti dengan nomor WhatsApp yang valid
    // console.log(`\n📲 Sending test message to ${phoneNumber}...`)
    // const result = await WhatsAppService.sendWhatsApp(phoneNumber, testData)
    // console.log("✅ Send result:", result)

    console.log("\n✅ Test completed")
  } catch (error) {
    console.error("❌ Test failed:", error)
  }
}

// Jalankan test
testWhatsAppService()
