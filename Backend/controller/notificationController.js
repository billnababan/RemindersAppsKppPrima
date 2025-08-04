const { query } = require("../utils/query");
const { formatDistanceToNow } = require("date-fns");
const { id: localeID } = require("date-fns/locale");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRoleId = req.user.role_id;

    const notifications = await query(
      `
      SELECT
        r.id AS reminder_id,
        r.title,
        r.message,
        r.is_read,
        r.priority,
        r.created_at,
        u.full_name AS sender_name,
        d.title AS document_title,
        d.id AS document_id
      FROM reminders r
      LEFT JOIN users u ON r.sender_id = u.id
      LEFT JOIN documents d ON r.document_id = d.id
      WHERE r.recipient_id = ? OR r.recipient_role_id = ?
      ORDER BY r.created_at DESC
      LIMIT 10
      `,
      [userId, userRoleId]
    );

    const formattedNotifications = notifications.map(n => ({
      id: n.reminder_id,
      title: n.title,
      message: n.message,
      time: n.created_at
        ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: localeID })
        : "waktu tidak tersedia",
      unread: n.is_read === 0 || n.is_read === false,
      priority: n.priority,
      link: n.document_id ? `/documents/${n.document_id}` : `/reminders/${n.reminder_id}`,
    }));

    res.json({ success: true, notifications: formattedNotifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
};

module.exports = {
  getNotifications,
};
