const prisma = require("../prisma");

/**
 * Badri Kedar Developer — Instant Interactive WhatsApp Bot Responder
 * Handles options 1 to 5, VISIT/VIDIT, ADVISOR, and greetings without state lock
 */
async function processLeadScriptMessage(lead, userMessage) {
  const text = (userMessage || "").trim();
  const lower = text.toLowerCase();

  let botReply = "";
  let matchedIntent = "";

  // 1. Check for Option 4 / VISIT / VIDIT (typo handling) / Site Visit
  if (
    text === "4" ||
    lower === "visit" ||
    lower === "vidit" ||
    lower.includes("site visit") ||
    lower.includes("book visit") ||
    lower.includes("visit") ||
    lower.includes("vidit") ||
    lower.includes("appointment") ||
    lower.includes("cab")
  ) {
    matchedIntent = "Site Visit";
    botReply = `🚗 Free VIP Site Visit Booking — Badri Kedar Developer\nWe provide complimentary door-to-door cab pickup and on-site expert guidance!\n\n• Free AC Cab Pickup & Drop facility\n• On-site layout walkthrough & documentation assistance\n• Available daily from 10:00 AM to 6:00 PM\n\nPlease reply with your preferred date (e.g., Tomorrow, This Sunday, or DD/MM) and our coordinator will call to confirm. You can also call directly at +91 90585 71709.`;
  }
  // 2. Check for Option 5 / ADVISOR / Call back / Talk to agent
  else if (
    text === "5" ||
    lower === "advisor" ||
    lower === "adviser" ||
    lower.includes("advisor") ||
    lower.includes("adviser") ||
    lower.includes("call me") ||
    lower.includes("talk to agent") ||
    lower.includes("phone call") ||
    lower.includes("contact") ||
    lower.includes("brochure")
  ) {
    matchedIntent = "Advisor";
    botReply = `📞 Senior Property Advisor — Badri Kedar Developer\nOur dedicated property consultant is ready to assist you with layout maps, pricing, and project details.\n\n• Direct Helpline: +91 90585 71709\n• Office: Badri Kedar Developer Head Office\n• Timings: 9:30 AM – 7:30 PM (Mon–Sun)\n\nOur senior advisor will call you shortly on this number. You can also type your specific questions right here!`;
  }
  // 3. Option 1: Residential Property & Plots
  else if (
    text === "1" ||
    lower.includes("residential") ||
    lower.includes("flat") ||
    lower.includes("villa") ||
    lower.includes("home") ||
    lower.includes("house")
  ) {
    matchedIntent = "Residential Property";
    botReply = `🏡 Residential Property & Plots — Badri Kedar Developer\nWe offer premium gated layouts in prime locations with complete modern amenities!\n\n• 30-40 ft wide paved roads, electricity, water, security & parks\n• Clear registry & mutation with immediate registry\n• Sizes available: 100 sq.yd, 150 sq.yd, 200 sq.yd, 500 sq.yd\n• Attractive payment plans & bank loan assistance\n\nReply VISIT to book a free site tour, or reply ADVISOR to speak with our property consultant!`;
  }
  // 4. Option 2: Commercial Property
  else if (
    text === "2" ||
    lower.includes("commercial") ||
    lower.includes("shop") ||
    lower.includes("office") ||
    lower.includes("complex") ||
    lower.includes("business")
  ) {
    matchedIntent = "Commercial Property";
    botReply = `🏢 Commercial Property & Spaces — Badri Kedar Developer\nHigh-ROI commercial spaces and showroom plots with main highway road frontage.\n\n• Prime frontage for retail shops, offices, and commercial complexes\n• Rapidly growing commercial hubs with high appreciation potential\n• Flexible installment payment plans and bank loan support\n\nReply VISIT to arrange an on-site visit, or reply ADVISOR to receive full commercial brochures and layout maps!`;
  }
  // 5. Option 3: Plots & Land
  else if (
    text === "3" ||
    lower.includes("plot") ||
    lower.includes("land")
  ) {
    matchedIntent = "Plots & Land";
    botReply = `🌳 Plots & Land Investment — Badri Kedar Developer\nFreehold approved plots with instant registry and mutation in high-growth corridors.\n\n• Plot sizes: 100 sq.yd, 150 sq.yd, 200 sq.yd, 300 sq.yd, 500 sq.yd\n• Wide 30-40 ft roads, boundary demarcation, water & electricity\n• High appreciation growth corridor with clear legal titles\n\nReply VISIT to schedule a free site tour, or reply ADVISOR to talk directly with our sales team!`;
  }
  // 6. Default / Greeting Menu
  else {
    const clientName = lead?.name && !lead.name.startsWith("Meta Lead") && !lead.name.startsWith("Lead (")
      ? lead.name
      : "Valued Client";

    botReply = `👋 Welcome to Badri Kedar Developer!\nWe help you find the right property — plots, flats & commercial spaces.\n\nNice to meet you, ${clientName}! What are you looking for today?\n1️⃣ 🏠 Residential Property\n2️⃣ 🏢 Commercial Property\n3️⃣ 🌳 Plot / Land\n4️⃣ 📍 Book a Free VIP Site Visit\n5️⃣ 📋 Speak with Property Advisor / Brochure\n\nPlease reply with 1, 2, 3, 4, or 5 (or type VISIT / ADVISOR) to get started! 🙂`;
  }

  // Update lead formAnswers with latest interaction if lead exists
  if (lead && lead.id) {
    try {
      const formAnswers = (lead.formAnswers && typeof lead.formAnswers === "object") ? { ...lead.formAnswers } : {};
      formAnswers.lastBotIntent = matchedIntent || text;
      formAnswers.lastBotInteraction = new Date().toISOString();

      await prisma.lead.update({
        where: { id: lead.id },
        data: { formAnswers }
      });
    } catch (e) {
      console.error("[BotEngine] Failed to update lead interaction:", e.message);
    }
  }

  return {
    reply: botReply,
    intent: matchedIntent
  };
}

module.exports = {
  processLeadScriptMessage
};
