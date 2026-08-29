// ============================================================
// services/whatsappService.js
// WhatsApp Lead Notification Service
// Sends template: "New Lead: {StudentName} wants {Subject} in {Location}. Check MentorNearby."
// ============================================================

/**
 * Sends a WhatsApp lead notification to a tutor
 * @param {Object} options
 * @param {string} options.teacherPhone - Phone number of tutor
 * @param {string} options.studentName - Name of student
 * @param {string} options.subject - Subject requested
 * @param {string} options.location - Location/area of student
 */
const sendLeadWhatsAppAlert = async ({ teacherPhone, studentName, subject, location }) => {
  const cleanPhone = (teacherPhone || '').replace(/[^0-9]/g, '');
  const sName = studentName || 'A Student';
  const sub = subject || 'Tuition';
  const loc = location || 'your area';

  const messageText = `New Lead: ${sName} wants ${sub} in ${loc}. Check MentorNearby: https://mentornearby.com/chat`;

  console.log(`[WhatsApp Lead Alert] Target: ${cleanPhone} | Message: ${messageText}`);

  // If WhatsApp API / Webhook URL is configured in environment
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiKey = process.env.WHATSAPP_API_KEY;

  if (whatsappApiUrl && cleanPhone) {
    try {
      const response = await fetch(whatsappApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(whatsappApiKey ? { Authorization: `Bearer ${whatsappApiKey}` } : {}),
        },
        body: JSON.stringify({
          phone: cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`,
          message: messageText,
          template: 'new_lead_alert',
          params: [sName, sub, loc],
        }),
      });

      const resData = await response.json().catch(() => ({}));
      console.log('[WhatsApp Lead Alert] Response:', resData);
      return { success: response.ok, data: resData };
    } catch (err) {
      console.warn('[WhatsApp Lead Alert] Delivery failed (gracefully ignored):', err.message);
      return { success: false, error: err.message };
    }
  }

  // If WhatsApp API credentials not set yet, log as stub
  return { success: true, stub: true, message: messageText };
};

module.exports = { sendLeadWhatsAppAlert };
