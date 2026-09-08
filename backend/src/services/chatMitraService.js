const axios = require("axios");
const prisma = require("../prisma");

const CHATMITRA_API_URL = "https://backend.chatmitra.com/developer/api/send_message";
const CHATMITRA_API_KEY = process.env.CHATMITRA_API_KEY || "4587f90396e62c6d885f06ab5ac0d3bf:ae3796c82d7da9d496940d64cee361d8b8aa4f8c3069783f3f2fcd2fd55467a0f9da214686846c8ab2b796aad53f3311c5a73dfce471587a530db92671d5951409c1f15b6e423cc4ff0e0cc0c81266d7ec7ccde541d402ef28ad8f4f3c07735548826fac668ae34bb09f0b9c8dd5d97050804ee587bdaf56a18bcd852508a1567523252b1a5cfd4c6c2884d142355e12b548ab39b530b172b1d7f944dfaefc789487265a891ef0f2abe5b284cf889a72cb3df95e3949be036b065045cdab1aea";

/**
 * Normalizes an Indian phone number to ChatMitra's required format (91XXXXXXXXXX)
 */
function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return null;
  // Strip non-digit characters
  let cleaned = String(rawPhone).replace(/[^\d]/g, "");

  // If starts with 0 and length is 11, strip leading 0
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // If 10 digits, prepend 91
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }

  // Must be valid 12-digit Indian number
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned;
  }

  return cleaned.length >= 10 ? cleaned : null;
}

/**
 * Sanitizes message body for ChatMitra raw text API
 * ChatMitra rejects '*' formatting with 'Text contains invalid characters'
 */
function sanitizeForChatMitraText(text) {
  if (!text) return "";
  return String(text).replace(/\*/g, "");
}

/**
 * Sends an automated welcome/greeting message to a new lead via ChatMitra WhatsApp
 */
async function sendChatMitraLeadGreeting(lead) {
  if (!lead || !lead.phone) return { success: false, reason: "No phone number" };

  const cleanPhone = normalizePhoneNumber(lead.phone);
  if (!cleanPhone) {
    console.log(`[ChatMitra] Skipped greeting for ${lead.name || 'Lead'}: invalid phone (${lead.phone})`);
    return { success: false, reason: "Invalid phone number" };
  }

  const clientName = lead.name && !lead.name.startsWith("Meta Lead") && !lead.name.startsWith("Lead (")
    ? lead.name
    : "Valued Client";

  const greetingBody = `👋 Welcome to Badri Kedar Developer!\nWe help you find the right property — plots, flats & commercial spaces.\n\nNice to meet you, ${clientName}! What are you looking for today?\n1️⃣ 🏠 Residential Property\n2️⃣ 🏢 Commercial Property\n3️⃣ 🌳 Plot / Land\n4️⃣ 📍 Book a Free VIP Site Visit\n5️⃣ 📋 Speak with Property Advisor / Brochure\n\nPlease reply with 1, 2, 3, 4, or 5 to get started! 🙂`;

  // 1. Try sending official Meta-approved template first (bypasses 24h customer window)
  try {
    const templatePayload = {
      recipient_mobile_number: cleanPhone,
      customer_name: clientName,
      messages: [
        {
          kind: "template",
          template: {
            name: "bkd_welcome_greeting",
            language: "en",
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: clientName
                  }
                ]
              }
            ]
          }
        }
      ]
    };

    const templateRes = await axios.post(CHATMITRA_API_URL, templatePayload, {
      headers: {
        "Authorization": `Bearer ${CHATMITRA_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 10000
    });

    if (templateRes.data?.send_status === "completed" || templateRes.data?.sent_count > 0) {
      console.log(`[ChatMitra] Sent template greeting 'bkd_welcome_greeting' to ${clientName} (${cleanPhone})`);

      if (lead.id) {
        const currentHistory = Array.isArray(lead.aiChatHistory) ? lead.aiChatHistory : [];
        currentHistory.push({
          sender: "bot",
          message: greetingBody,
          timestamp: new Date().toISOString(),
          channel: "whatsapp_chatmitra",
          status: "sent",
          template: "bkd_welcome_greeting"
        });

        await prisma.lead.update({
          where: { id: lead.id },
          data: { aiChatHistory: currentHistory }
        }).catch(err => console.error("[ChatMitra] Failed to log chat history:", err.message));
      }

      return { success: true, data: templateRes.data };
    }
  } catch (tmplErr) {
    console.log(`[ChatMitra] Template send pending/unavailable, using raw session dispatch:`, tmplErr.response?.data?.message || tmplErr.message);
  }

  // 2. Fallback to raw session message (for active 24h window)
  try {
    const payload = {
      recipient_mobile_number: cleanPhone,
      customer_name: clientName,
      messages: [
        {
          kind: "raw",
          payload: {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "text",
            text: {
              preview_url: false,
              body: sanitizeForChatMitraText(greetingBody)
            }
          }
        }
      ]
    };

    const response = await axios.post(CHATMITRA_API_URL, payload, {
      headers: {
        "Authorization": `Bearer ${CHATMITRA_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 12000
    });

    console.log(`[ChatMitra] Sent raw greeting to ${clientName} (${cleanPhone}): Status ${response.status}`);

    // Log message in lead's aiChatHistory if lead.id is present
    if (lead.id) {
      const currentHistory = Array.isArray(lead.aiChatHistory) ? lead.aiChatHistory : [];
      currentHistory.push({
        sender: "bot",
        message: greetingBody,
        timestamp: new Date().toISOString(),
        channel: "whatsapp_chatmitra",
        status: "sent"
      });

      await prisma.lead.update({
        where: { id: lead.id },
        data: { aiChatHistory: currentHistory }
      }).catch(err => console.error("[ChatMitra] Failed to log chat history:", err.message));
    }

    return { success: true, data: response.data };
  } catch (err) {
    const errorDetail = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error(`[ChatMitra] Failed to send greeting to ${cleanPhone}:`, err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message, reason: errorDetail };
  }
}

/**
 * Sends a custom WhatsApp message to a lead
 */
async function sendCustomWhatsAppMessage(phone, messageText, leadId = null, senderName = "Agent") {
  const cleanPhone = normalizePhoneNumber(phone);
  if (!cleanPhone) throw new Error("Invalid phone number");

  const sanitizedBody = sanitizeForChatMitraText(messageText);

  const payload = {
    recipient_mobile_number: cleanPhone,
    customer_name: "Customer",
    messages: [
      {
        kind: "raw",
        payload: {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: {
            preview_url: false,
            body: sanitizedBody
          }
        }
      }
    ]
  };

  const response = await axios.post(CHATMITRA_API_URL, payload, {
    headers: {
      "Authorization": `Bearer ${CHATMITRA_API_KEY}`,
      "Content-Type": "application/json"
    },
    timeout: 12000
  });

  if (leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (lead) {
      const currentHistory = Array.isArray(lead.aiChatHistory) ? lead.aiChatHistory : [];
      currentHistory.push({
        sender: senderName,
        message: sanitizedBody,
        timestamp: new Date().toISOString(),
        channel: "whatsapp_chatmitra",
        status: "sent"
      });
      await prisma.lead.update({
        where: { id: leadId },
        data: { aiChatHistory: currentHistory }
      });
    }
  }

  return response.data;
}

module.exports = {
  normalizePhoneNumber,
  sanitizeForChatMitraText,
  sendChatMitraLeadGreeting,
  sendCustomWhatsAppMessage
};
