const { query } = require("../utils/query");
const whatsappService = require("../services/whatsappService");

/**
 * WhatsApp Controller untuk KPP Si PRIMA
 * Handle semua operasi WhatsApp integration
 */

// Test WhatsApp connection
const testWhatsApp = async (req, res) => {
  try {
    const { phone_number, message = "Test message dari KPP Si PRIMA" } = req.body;

    if (!phone_number) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const testData = {
      title: "Test WhatsApp Connection",
      message: message,
      priority: "medium",
      reminder_type: "manual",
      due_date: null,
      recipient_role: "Test User",
      document_title: null
    };

    const result = await whatsappService.sendWhatsApp(phone_number, testData);

    return res.status(200).json({
      success: true,
      message: "WhatsApp test message sent successfully",
      data: result
    });
  } catch (error) {
    console.error("Test WhatsApp error:", error);
    return res.status(500).json({ 
      error: "Failed to send test WhatsApp message",
      details: error.message 
    });
  }
};

// Send reminder via WhatsApp
const sendReminderWhatsApp = async (req, res) => {
  try {
    const { 
      reminder_id, 
      phone_number, 
      title, 
      message, 
      priority = "medium",
      reminder_type = "manual",
      due_date,
      recipient_role 
    } = req.body;

    // Validate required fields
    if (!phone_number || !title || !message) {
      return res.status(400).json({ 
        error: "Phone number, title, and message are required" 
      });
    }

    // Get reminder details if reminder_id provided
    let reminderData = {
      title,
      message,
      priority,
      reminder_type,
      due_date,
      recipient_role,
      document_title: null
    };

    if (reminder_id) {
      const reminder = await query(
        `SELECT r.*, d.title as document_title, u.full_name as sender_name
         FROM reminders r 
         LEFT JOIN documents d ON r.document_id = d.id
         LEFT JOIN users u ON r.sender_id = u.id
         WHERE r.id = ?`,
        [reminder_id]
      );

      if (reminder.length > 0) {
        const r = reminder[0];
        reminderData = {
          title: r.title,
          message: r.message,
          priority: r.priority,
          reminder_type: r.reminder_type,
          due_date: r.due_date,
          recipient_role: recipient_role,
          document_title: r.document_title
        };
      }
    }

    const result = await whatsappService.sendWhatsApp(phone_number, reminderData);

    // Log WhatsApp activity
    if (reminder_id) {
      await query(
        `INSERT INTO whatsapp_logs (reminder_id, phone_number, message_id, provider, status, sent_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [reminder_id, phone_number, result.messageId, result.provider, 'sent']
      );
    }

    return res.status(200).json({
      success: true,
      message: "WhatsApp reminder sent successfully",
      data: {
        messageId: result.messageId,
        provider: result.provider,
        phone_number: phone_number
      }
    });
  } catch (error) {
    console.error("Send reminder WhatsApp error:", error);
    return res.status(500).json({ 
      error: "Failed to send WhatsApp reminder",
      details: error.message 
    });
  }
};

// Send bulk WhatsApp to role
const sendBulkWhatsAppToRole = async (req, res) => {
  try {
    const { 
      role_id, 
      title, 
      message, 
      priority = "medium",
      reminder_type = "manual",
      due_date 
    } = req.body;

    if (!role_id || !title || !message) {
      return res.status(400).json({ 
        error: "Role ID, title, and message are required" 
      });
    }

    // Get users with phone numbers for the role
    const users = await query(
      `SELECT u.id, u.full_name, u.phone_number, r.name as role_name
       FROM users u 
       JOIN roles r ON u.role_id = r.id
       WHERE u.role_id = ? AND u.is_active = TRUE AND u.phone_number IS NOT NULL`,
      [role_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: "No active users with phone numbers found for this role" 
      });
    }

    const reminderData = {
      title,
      message,
      priority,
      reminder_type,
      due_date,
      document_title: null
    };

    const results = await whatsappService.sendBulkWhatsApp(users, reminderData);

    // Count success/failed
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return res.status(200).json({
      success: true,
      message: `Bulk WhatsApp sent to ${users.length} users`,
      summary: {
        total: users.length,
        success: successCount,
        failed: failedCount
      },
      results: results
    });
  } catch (error) {
    console.error("Bulk WhatsApp error:", error);
    return res.status(500).json({ 
      error: "Failed to send bulk WhatsApp",
      details: error.message 
    });
  }
};

// Get WhatsApp logs
const getWhatsAppLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "all" } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (status !== "all") {
      whereClause += " AND wl.status = ?";
      params.push(status);
    }

    const logs = await query(
      `SELECT wl.*, r.title as reminder_title, u.full_name as recipient_name
       FROM whatsapp_logs wl
       LEFT JOIN reminders r ON wl.reminder_id = r.id
       LEFT JOIN users u ON wl.phone_number = u.phone_number
       ${whereClause}
       ORDER BY wl.sent_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [{ total }] = await query(
      `SELECT COUNT(*) as total FROM whatsapp_logs wl ${whereClause}`,
      params
    );

    return res.json({
      logs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("Get WhatsApp logs error:", error);
    return res.status(500).json({ error: "Failed to fetch WhatsApp logs" });
  }
};

// Get WhatsApp statistics
const getWhatsAppStats = async (req, res) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_sent,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN provider = 'twilio' THEN 1 ELSE 0 END) as via_twilio,
        SUM(CASE WHEN provider = 'meta' THEN 1 ELSE 0 END) as via_meta,
        SUM(CASE WHEN provider = 'mock' THEN 1 ELSE 0 END) as via_mock,
        DATE(sent_at) as date
      FROM whatsapp_logs 
      WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(sent_at)
      ORDER BY date DESC
    `);

    const totalStats = await query(`
      SELECT 
        COUNT(*) as total_messages,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as total_successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as total_failed
      FROM whatsapp_logs
    `);

    return res.json({
      daily_stats: stats,
      overall_stats: totalStats[0] || {
        total_messages: 0,
        total_successful: 0,
        total_failed: 0
      }
    });
  } catch (error) {
    console.error("Get WhatsApp stats error:", error);
    return res.status(500).json({ error: "Failed to fetch WhatsApp statistics" });
  }
};

module.exports = {
  testWhatsApp,
  sendReminderWhatsApp,
  sendBulkWhatsAppToRole,
  getWhatsAppLogs,
  getWhatsAppStats
};