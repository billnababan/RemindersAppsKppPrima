const axios = require("axios")

class WhatsAppService {
  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    this.twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"
    this.metaAccessToken = process.env.WHATSAPP_ACCESS_TOKEN
    this.metaPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  }

  formatKPPMessage(reminderData) {
    const { title, message, priority, reminder_type, due_date, recipient_role, document_title } = reminderData

    const priorityEmoji = {
      low: "🟢",
      medium: "🟡",
      high: "🟠",
      urgent: "🔴",
    }

    // ✅ PERBAIKAN: Update type config untuk manual dan scheduled
    const typeConfig = {
      rekonsil: { emoji: "📊", title: "REKONSIL SURVEYOR" },
      ba_mining: { emoji: "📋", title: "PEMBUATAN BA MINING" },
      sign_ba: { emoji: "✍️", title: "E-SIGN BA MINING" },
      pengiriman: { emoji: "📤", title: "PENGIRIMAN BA" },
      monitoring: { emoji: "👁️", title: "KPHO MONITORING" },
      manual: { emoji: "📢", title: "REMINDER MANUAL" },
      scheduled: { emoji: "⏰", title: "REMINDER OTOMATIS" }, // ✅ PERBAIKAN: Tambah scheduled type
      automatic: { emoji: "🤖", title: "REMINDER OTOMATIS" }, // Alias untuk scheduled
    }

    const config = typeConfig[reminder_type] || typeConfig.manual

    let formattedMessage = `🏢 *KPP SI PRIMA REMINDER*\n\n`
    formattedMessage += `${config.emoji} *${config.title}*\n`
    formattedMessage += `${priorityEmoji[priority]} *${priority.toUpperCase()} PRIORITY*\n\n`
    formattedMessage += `📋 *${title}*\n`
    formattedMessage += `📝 ${message}\n`

    if (due_date) {
      formattedMessage += `\n⏰ *Deadline:* ${new Date(due_date).toLocaleString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}\n`
    }

    if (document_title) {
      formattedMessage += `\n📎 *Document:* ${document_title}\n`
    }

    if (recipient_role) {
      formattedMessage += `\n👥 *Untuk:* ${recipient_role}\n`
    }

    // ✅ PERBAIKAN: Tampilkan jenis reminder
    const reminderTypeText = reminder_type === "manual" ? "Manual" : "Otomatis"
    formattedMessage += `\n📱 *Pesan:* ${reminderTypeText}\n`

    formattedMessage += `\n---\n_KPP Priamanaya Reminder Assistant_\n_Sistem Reminder BA Mining Process_`

    return formattedMessage
  }

  async sendViaTwilio(phoneNumber, message) {
    try {
      if (!this.twilioAccountSid || !this.twilioAuthToken) {
        throw new Error("Twilio credentials not configured")
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`
      const auth = Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString("base64")

      const response = await axios.post(
        url,
        new URLSearchParams({
          From: this.twilioWhatsAppNumber,
          To: `whatsapp:${phoneNumber}`,
          Body: message,
        }),
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      )

      console.log("✅ Twilio WhatsApp sent, SID:", response.data.sid)
      return {
        success: true,
        messageId: response.data.sid,
        provider: "twilio",
        status: response.data.status,
      }
    } catch (error) {
      console.error("❌ Twilio send error:", error.response?.data || error.message)
      throw new Error(`Twilio WhatsApp send failed: ${error.response?.data?.message || error.message}`)
    }
  }

  async sendViaMeta(phoneNumber, message) {
    try {
      if (!this.metaAccessToken || !this.metaPhoneNumberId) {
        throw new Error("Meta WhatsApp credentials not configured")
      }

      // Clean phone number (remove + if exists)
      const cleanPhoneNumber = phoneNumber.replace(/^\+/, "")

      const url = `https://graph.facebook.com/v18.0/${this.metaPhoneNumberId}/messages`

      const response = await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          to: cleanPhoneNumber,
          type: "text",
          text: {
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.metaAccessToken}`,
            "Content-Type": "application/json",
          },
        },
      )

      console.log("✅ Meta WhatsApp sent:", response.data.messages[0].id)
      return {
        success: true,
        messageId: response.data.messages[0].id,
        provider: "meta",
        status: "sent",
      }
    } catch (error) {
      console.error("❌ Meta send error:", error.response?.data || error.message)
      throw new Error(`Meta WhatsApp send failed: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  async sendViaFonnte(phoneNumber, message) {
    try {
      const apiKey = process.env.FONNTE_API_KEY
      if (!apiKey) throw new Error("Fonnte API key not configured")

      // 🔧 Clean phone number untuk Fonnte
      let cleanPhoneNumber = phoneNumber

      // Remove country code jika ada
      if (cleanPhoneNumber.startsWith("62")) {
        cleanPhoneNumber = cleanPhoneNumber.substring(2)
      }
      if (cleanPhoneNumber.startsWith("+62")) {
        cleanPhoneNumber = cleanPhoneNumber.substring(3)
      }
      if (cleanPhoneNumber.startsWith("0")) {
        cleanPhoneNumber = cleanPhoneNumber.substring(1)
      }

      // Add 62 prefix
      const formattedPhone = `62${cleanPhoneNumber}`

      console.log("📤 Fonnte request:", {
        original: phoneNumber,
        formatted: formattedPhone,
        messageLength: message.length,
      })

      const response = await axios.post(
        "https://api.fonnte.com/send",
        {
          target: formattedPhone,
          message: message,
          countryCode: "62",
        },
        {
          headers: {
            Authorization: apiKey,
          },
        },
      )

      console.log("✅ Fonnte response:", response.data)

      const isSuccess = response.data.status === true || response.data.status === "success"

      return {
        success: isSuccess,
        messageId: response.data.id || response.data.detail || null,
        provider: "fonnte",
        status: response.data.status,
        detail: response.data,
      }
    } catch (error) {
      console.error("❌ Fonnte error:", error.response?.data || error.message)
      throw new Error(`Fonnte send failed: ${error.response?.data?.reason || error.message}`)
    }
  }

  async mockSend(phoneNumber, message) {
    console.log("🧪 MOCK WhatsApp Send")
    console.log("📱 To:", phoneNumber)
    console.log("📝 Message:", message)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: "mock",
      status: "sent",
    }
  }

  async sendWhatsApp(phoneNumber, reminderData) {
    try {
      // Format jadi string pesan
      const formattedMessage = this.formatKPPMessage(reminderData)
      console.log("📨 Message to send:", formattedMessage)

      if (process.env.FONNTE_API_KEY) {
        return await this.sendViaFonnte(phoneNumber, formattedMessage)
      } else if (this.twilioAccountSid && this.twilioAuthToken) {
        return await this.sendViaTwilio(phoneNumber, formattedMessage)
      } else if (this.metaAccessToken && this.metaPhoneNumberId) {
        return await this.sendViaMeta(phoneNumber, formattedMessage)
      } else {
        return await this.mockSend(phoneNumber, formattedMessage)
      }
    } catch (error) {
      console.error("❌ WhatsApp send failed:", error.message)
      throw error
    }
  }

  async sendBulkWhatsApp(recipients, reminderData) {
    const results = []
    for (const recipient of recipients) {
      try {
        const result = await this.sendWhatsApp(recipient.phone_number, {
          ...reminderData,
          recipient_role: recipient.role_name,
        })
        results.push({
          recipient: recipient.phone_number,
          name: recipient.full_name,
          success: true,
          messageId: result.messageId,
          provider: result.provider,
        })
      } catch (error) {
        results.push({
          recipient: recipient.phone_number,
          name: recipient.full_name,
          success: false,
          error: error.message,
        })
      }
      // Delay between messages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    return results
  }
}

module.exports = new WhatsAppService()
