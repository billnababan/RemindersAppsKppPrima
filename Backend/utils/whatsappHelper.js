/**
 * WhatsApp Helper Functions untuk KPP Si PRIMA
 */

// Validate Indonesian phone number
const validatePhoneNumber = (phoneNumber) => {
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Indonesian phone number patterns
  const patterns = [
    /^62\d{9,13}$/,     // +62 format
    /^0\d{9,12}$/,      // 0 format
    /^\d{9,12}$/        // without prefix
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
};

// Format phone number to international format
const formatPhoneNumber = (phoneNumber) => {
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Convert to +62 format
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  return '+' + cleaned;
};

// Get reminder type emoji
const getReminderTypeEmoji = (type) => {
  const emojiMap = {
    rekonsil: "📊",
    ba_mining: "📋", 
    sign_ba: "✍️",
    pengiriman: "📤",
    monitoring: "👁️",
    manual: "📢"
  };
  
  return emojiMap[type] || "📢";
};

// Get priority emoji and color
const getPriorityConfig = (priority) => {
  const config = {
    low: { emoji: "🟢", color: "green" },
    medium: { emoji: "🟡", color: "yellow" },
    high: { emoji: "🟠", color: "orange" },
    urgent: { emoji: "🔴", color: "red" }
  };
  
  return config[priority] || config.medium;
};

// Generate WhatsApp deep link
const generateWhatsAppLink = (phoneNumber, message) => {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedNumber.replace('+', '')}?text=${encodedMessage}`;
};

// Check if phone number is WhatsApp Business
const isWhatsAppBusiness = async (phoneNumber) => {
  // This would require WhatsApp Business API to check
  // For now, return true as placeholder
  return true;
};

// Format date for Indonesian locale
const formatDateIndonesian = (date) => {
  return new Date(date).toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  });
};

// Generate message template for different reminder types
const generateMessageTemplate = (type, data) => {
  const templates = {
    rekonsil: `
🏢 *KPP SI PRIMA - REKONSIL REMINDER*

📊 Waktunya melakukan rekonsil bulanan!

📅 *Periode:* ${data.period || 'Bulan ini'}
⏰ *Deadline:* ${data.deadline || 'Tanggal 5'}
👥 *Tim:* Surveyor PT. Kalimantan Prima Persada

📝 Mohon segera lakukan proses rekonsil sesuai jadwal yang telah ditentukan.

---
_KPP Priamanaya Reminder Assistant_
    `,
    
    ba_mining: `
🏢 *KPP SI PRIMA - BA MINING REMINDER*

📋 Pembuatan BA Mining perlu segera diselesaikan!

📅 *Tanggal:* ${data.date || 'Hari ini'}
👥 *PIC:* ${data.pic || 'Engineering PELH'}

📝 ${data.message || 'Mohon segera buat BA Mining sesuai jadwal.'}

---
_KPP Priamanaya Reminder Assistant_
    `,
    
    sign_ba: `
🏢 *KPP SI PRIMA - E-SIGN REMINDER*

✍️ BA Mining menunggu tanda tangan elektronik Anda!

📋 *Document:* ${data.document || 'BA Mining'}
👤 *Penandatangan:* ${data.signer || 'Anda'}
⏰ *Deadline:* ${data.deadline || 'Segera'}

📝 Silakan akses sistem untuk melakukan e-sign.

---
_KPP Priamanaya Reminder Assistant_
    `
  };
  
  return templates[type] || templates.ba_mining;
};

module.exports = {
  validatePhoneNumber,
  formatPhoneNumber,
  getReminderTypeEmoji,
  getPriorityConfig,
  generateWhatsAppLink,
  isWhatsAppBusiness,
  formatDateIndonesian,
  generateMessageTemplate
};