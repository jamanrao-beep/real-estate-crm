const prisma = require("../prisma");
const { normalizePhoneNumber } = require("../services/chatMitraService");

/**
 * Handles incoming webhooks from ChatMitra
 * Events: message.received, message.sent, message.status.updated
 */
async function receiveChatMitraWebhook(req, res) {
  // Acknowledge receipt immediately so ChatMitra doesn't retry
  res.status(200).json({ status: "received" });

  try {
    const payload = req.body;
    console.log("[ChatMitra Webhook] Incoming payload:", JSON.stringify(payload));

    const event = payload.event || payload.type || "message.received";
    const data = payload.data || payload;

    // Extract sender phone number and message
    const rawPhone = data.from || data.sender || data.customer_number || data.phone || data.recipient_mobile_number;
    const cleanPhone = normalizePhoneNumber(rawPhone);

    const messageText = data.text?.body || data.body || data.message || (typeof data.text === "string" ? data.text : "");
    const customerName = data.customer_name || data.name || data.sender_name || "WhatsApp Client";

    if (!cleanPhone || !messageText) {
      console.log("[ChatMitra Webhook] Missing phone or text in payload, skipping.");
      return;
    }

    const isCustomerMessage = event === "message.received" || !data.is_outgoing;
    const sender = isCustomerMessage ? "customer" : "bot";

    // 1. Find existing lead by phone (check standard 10 digit, 12 digit with 91, or +91)
    const phoneVariants = [
      cleanPhone,
      cleanPhone.replace(/^91/, ""),
      `+${cleanPhone}`,
      cleanPhone.startsWith("91") ? cleanPhone.slice(2) : cleanPhone
    ];

    let lead = await prisma.lead.findFirst({
      where: {
        phone: { in: phoneVariants }
      }
    });

    // 2. If lead doesn't exist and it's an incoming customer message, create new lead
    if (!lead && isCustomerMessage) {
      lead = await prisma.lead.create({
        data: {
          name: customerName !== "WhatsApp Client" ? customerName : `WhatsApp Lead (${cleanPhone.slice(-10)})`,
          phone: cleanPhone,
          source: "WhatsApp Bot (ChatMitra)",
          status: "ACTIVE",
          category: "HOT",
          funnelStage: "INTERESTED",
          aiChatHistory: [],
          dateReceived: new Date()
        }
      });
      console.log(`[ChatMitra Webhook] Created new lead from WhatsApp: ${lead.name} (${cleanPhone})`);

      // Notify admins of new inbound WhatsApp conversation
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            message: `New Inbound WhatsApp Lead: ${lead.name} texted the BKD Bot: "${messageText.substring(0, 60)}..."`
          }))
        }).catch(err => console.error("Notification create error:", err.message));
      }
    }

    if (!lead) return;

    // 3. Append customer message to AI Chat History
    const chatHistory = Array.isArray(lead.aiChatHistory) ? [...lead.aiChatHistory] : [];
    chatHistory.push({
      sender,
      message: messageText,
      timestamp: new Date().toISOString(),
      channel: "whatsapp_chatmitra"
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { aiChatHistory: chatHistory }
    });

    // 4. Process multi-step script engine for customer messages
    if (isCustomerMessage) {
      const { processLeadScriptMessage } = require("../services/botScriptEngine");
      const { sendCustomWhatsAppMessage } = require("../services/chatMitraService");

      const scriptResult = await processLeadScriptMessage(lead, messageText);
      
      if (scriptResult && scriptResult.reply) {
        // Send automated scripted response back on WhatsApp
        await sendCustomWhatsAppMessage(cleanPhone, scriptResult.reply, lead.id, "Bot BKD").catch(err =>
          console.error(`[ChatMitra Webhook] Failed to dispatch bot reply to ${cleanPhone}:`, err.message)
        );
        console.log(`[ChatMitra Webhook] Dispatched scripted reply to ${lead.name} (${cleanPhone}) for step: ${scriptResult.nextStep}`);
      }
    }

    console.log(`[ChatMitra Webhook] Successfully handled message for lead ${lead.id} (${lead.name}).`);
  } catch (err) {
    console.error("[ChatMitra Webhook] Error processing event:", err);
  }
}

module.exports = { receiveChatMitraWebhook };

