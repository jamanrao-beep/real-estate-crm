const prisma = require("../prisma");
const { sendCustomWhatsAppMessage } = require("./chatMitraService");

/**
 * Badri Kedar Developer — Interactive Bot Script State Machine
 * Based on assets/Badri_Kedar_Developer_Chatbot_Script.md
 */

const SCRIPT_STEPS = {
  WELCOME: "WELCOME",
  INTENT: "INTENT",
  LOCATION: "LOCATION",
  BUDGET: "BUDGET",
  TIMELINE: "TIMELINE",
  APPOINTMENT_TYPE: "APPOINTMENT_TYPE",
  APPOINTMENT_DATE: "APPOINTMENT_DATE",
  APPOINTMENT_TIME: "APPOINTMENT_TIME",
  CONFIRMED: "CONFIRMED"
};

/**
 * Generates the scripted response and state transition given a user message
 */
async function processLeadScriptMessage(lead, userMessage) {
  const text = (userMessage || "").trim();
  const lower = text.toLowerCase();

  // Load or initialize bot state
  const formAnswers = (lead.formAnswers && typeof lead.formAnswers === "object") ? { ...lead.formAnswers } : {};
  let botState = formAnswers.botState || {
    step: SCRIPT_STEPS.INTENT,
    data: {
      name: lead.name,
      phone: lead.phone
    }
  };

  let botReply = "";
  let nextStep = botState.step;
  let isAppointmentBooked = false;

  // Global override: If user explicitly mentions "visit" or "site visit" or "book" at any point
  if (lower.includes("site visit") || lower.includes("book visit") || lower.includes("visit book") || lower.includes("appointment")) {
    botState.data.appointment_type = "Site Visit";
    nextStep = SCRIPT_STEPS.APPOINTMENT_DATE;
    botReply = `🚗 Free Site Visit Booking — Badri Kedar Developer\nWe offer complimentary cab pickup and on-site property consultation!\n\nPlease choose your preferred date:\n(e.g., Tomorrow, This Saturday, Sunday, or DD/MM/YYYY)`;
  } 
  // Global override: If user asks for advisor/call
  else if (lower.includes("call me") || lower.includes("advisor") || lower.includes("talk to agent") || lower.includes("phone call")) {
    botState.data.appointment_type = "Call Back";
    nextStep = SCRIPT_STEPS.APPOINTMENT_DATE;
    botReply = `📞 Connect with Senior Property Advisor\nPlease let us know your preferred date and time for our advisor to call you:\n(e.g., Today at 4 PM, Tomorrow morning)`;
  }
  // Standard Script Flow
  else {
    switch (botState.step) {
      case SCRIPT_STEPS.WELCOME:
      case SCRIPT_STEPS.INTENT: {
        // If user replied with a number or keyword for Intent
        if (text === "1" || lower.includes("residential") || lower.includes("flat") || lower.includes("villa") || lower.includes("home")) {
          botState.data.interest = "Residential Property (Villas / Gated Layouts)";
          nextStep = SCRIPT_STEPS.LOCATION;
          botReply = `🏡 Residential Property\nGreat choice! We have premium gated layouts & residential plots with 30-40 ft wide roads, water & electricity.\n\nWhich location/area or project are you interested in?\n(e.g. Highway corridor, Township, or City area)`;
        } else if (text === "2" || lower.includes("commercial") || lower.includes("shop") || lower.includes("office")) {
          botState.data.interest = "Commercial Property / Investment";
          nextStep = SCRIPT_STEPS.LOCATION;
          botReply = `🏢 Commercial Property\nHigh-ROI commercial spaces with main highway road frontage.\n\nWhich location or project area do you prefer?`;
        } else if (text === "3" || lower.includes("plot") || lower.includes("land")) {
          botState.data.interest = "Plot / Land (100 - 500 sq.yd)";
          nextStep = SCRIPT_STEPS.LOCATION;
          botReply = `🌳 Plots & Land\nFreehold plots with instant registry & mutation in prime growth corridors.\n\nWhich location/sector are you interested in exploring?`;
        } else if (text === "4" || lower.includes("exploring") || lower.includes("brochure") || lower.includes("info")) {
          botState.data.interest = "Just Exploring / Brochure";
          nextStep = SCRIPT_STEPS.BUDGET;
          botReply = `📋 Badri Kedar Developer Projects\nWe have exciting residential and commercial developments!\n\nWhat is your approximate budget range?\n1️⃣ Under ₹30L\n2️⃣ ₹30L – ₹60L\n3️⃣ ₹60L – ₹1Cr\n4️⃣ ₹1Cr+\n\nReply with 1, 2, 3, or 4:`;
        } else {
          // If greeting or unknown text, present intent options
          nextStep = SCRIPT_STEPS.INTENT;
          botReply = `👋 Welcome to Badri Kedar Developer!\nWe help you find the right property — plots, villas & commercial spaces.\n\nWhat are you looking for today? Please reply with a number:\n1️⃣ 🏠 Residential Property\n2️⃣ 🏢 Commercial Property\n3️⃣ 🌳 Plot / Land\n4️⃣ 📋 Just Exploring / Brochure`;
        }
        break;
      }

      case SCRIPT_STEPS.LOCATION: {
        botState.data.location = text;
        nextStep = SCRIPT_STEPS.BUDGET;
        botReply = `Got it! What is your approximate budget range?\n\n1️⃣ Under ₹30L\n2️⃣ ₹30L – ₹60L\n3️⃣ ₹60L – ₹1Cr\n4️⃣ ₹1Cr+\n\nPlease reply with 1, 2, 3, or 4:`;
        break;
      }

      case SCRIPT_STEPS.BUDGET: {
        let budgetText = text;
        if (text === "1" || lower.includes("under 30") || lower.includes("30l")) budgetText = "Under ₹30 Lakhs";
        else if (text === "2" || lower.includes("30") || lower.includes("60")) budgetText = "₹30L – ₹60 Lakhs";
        else if (text === "3" || lower.includes("60") || lower.includes("1cr")) budgetText = "₹60L – ₹1 Crore";
        else if (text === "4" || lower.includes("1cr+") || lower.includes("above 1cr")) budgetText = "₹1 Crore+";

        botState.data.budget = budgetText;
        nextStep = SCRIPT_STEPS.TIMELINE;
        botReply = `Thank you! When are you planning to buy/invest?\n\n1️⃣ Immediately (within 1 month)\n2️⃣ In 1–3 months\n3️⃣ In 3–6 months\n4️⃣ Just researching\n\nPlease reply with 1, 2, 3, or 4:`;
        break;
      }

      case SCRIPT_STEPS.TIMELINE: {
        let timelineText = text;
        if (text === "1" || lower.includes("immediately") || lower.includes("1 month")) timelineText = "Immediately (within 1 month)";
        else if (text === "2" || lower.includes("1-3") || lower.includes("3 months")) timelineText = "1–3 months";
        else if (text === "3" || lower.includes("3-6") || lower.includes("6 months")) timelineText = "3–6 months";
        else if (text === "4" || lower.includes("research")) timelineText = "Just researching";

        botState.data.timeline = timelineText;
        nextStep = SCRIPT_STEPS.APPOINTMENT_TYPE;
        botReply = `Excellent! Would you like to schedule a site visit or a call with our sales team?\n\n1️⃣ 📍 Site Visit (Free Cab & On-site consultation)\n2️⃣ ☎️ Call Back from Senior Advisor\n3️⃣ 🏢 Office Meeting\n\nPlease reply with 1, 2, or 3:`;
        break;
      }

      case SCRIPT_STEPS.APPOINTMENT_TYPE: {
        let appType = "Site Visit";
        if (text === "1" || lower.includes("site") || lower.includes("visit")) appType = "Site Visit";
        else if (text === "2" || lower.includes("call")) appType = "Call Back";
        else if (text === "3" || lower.includes("office") || lower.includes("meeting")) appType = "Office Meeting";

        botState.data.appointment_type = appType;
        nextStep = SCRIPT_STEPS.APPOINTMENT_DATE;
        botReply = `Perfect! Please choose your preferred date for the ${appType}:\n(e.g., Tomorrow, This Saturday, Sunday, or DD/MM/YYYY)`;
        break;
      }

      case SCRIPT_STEPS.APPOINTMENT_DATE: {
        botState.data.date = text;
        nextStep = SCRIPT_STEPS.APPOINTMENT_TIME;
        botReply = `Great! And what time slot works best for you?\n\n1️⃣ 10:00 AM – 12:00 PM\n2️⃣ 12:00 PM – 2:00 PM\n3️⃣ 4:00 PM – 6:00 PM\n4️⃣ 6:00 PM – 8:00 PM\n\nPlease reply with 1, 2, 3, or 4 (or specify a custom time):`;
        break;
      }

      case SCRIPT_STEPS.APPOINTMENT_TIME: {
        let timeSlot = text;
        if (text === "1") timeSlot = "10:00 AM – 12:00 PM";
        else if (text === "2") timeSlot = "12:00 PM – 2:00 PM";
        else if (text === "3") timeSlot = "4:00 PM – 6:00 PM";
        else if (text === "4") timeSlot = "6:00 PM – 8:00 PM";

        botState.data.time = timeSlot;
        nextStep = SCRIPT_STEPS.CONFIRMED;
        isAppointmentBooked = true;

        const clientName = botState.data.name || lead.name || "Valued Client";
        const visitType = botState.data.appointment_type || "Site Visit";
        const dateStr = botState.data.date || "Upcoming";
        const interestStr = botState.data.interest || "Badri Kedar Developer Plots";

        botReply = `✅ Your appointment is booked!\n\n• 👤 Name: ${clientName}\n• 📅 Date: ${dateStr}\n• ⏰ Time: ${timeSlot}\n• 📍 Type: ${visitType}\n• 🏠 Interest: ${interestStr}\n\nOur team will call you shortly to confirm details. Thank you for choosing Badri Kedar Developer! 🙏`;
        break;
      }

      case SCRIPT_STEPS.CONFIRMED: {
        // Fallback / FAQ handling after confirmation
        if (lower.includes("price") || lower.includes("rate") || lower.includes("cost")) {
          botReply = `Plots starting from ₹15 Lakhs onwards with attractive payment plans and bank loan support. Our sales manager will provide the exact layout pricing during your visit. Would you like to adjust your appointment timing?`;
        } else if (lower.includes("location") || lower.includes("address") || lower.includes("where")) {
          botReply = `Our prime projects are situated near major highway corridors with wide road access and rapid appreciation. We offer complimentary pickup for site visits.`;
        } else {
          botReply = `Thank you! Your inquiry is registered with Badri Kedar Developer. Our senior property advisor will reach out to you directly. You can also reach our helpline at +91 90585 71709.`;
        }
        break;
      }

      default: {
        nextStep = SCRIPT_STEPS.INTENT;
        botReply = `👋 Welcome to Badri Kedar Developer!\nHow can we assist you today?\n1️⃣ 🏠 Residential Property\n2️⃣ 🏢 Commercial Property\n3️⃣ 🌳 Plot / Land\n4️⃣ 📍 Book a Free Site Visit\n\nReply with 1, 2, 3, or 4:`;
      }
    }
  }

  // Update bot state in lead
  botState.step = nextStep;
  formAnswers.botState = botState;

  const updatePayload = {
    formAnswers
  };

  // If appointment booked or HOT interest, update CRM lead fields
  if (isAppointmentBooked || botState.data.appointment_type) {
    updatePayload.category = "HOT";
    updatePayload.funnelStage = "INTERESTED";

    // Set follow up details in CRM
    const appType = botState.data.appointment_type || "Site Visit";
    const appDate = botState.data.date || "Scheduled";
    const appTime = botState.data.time || "";
    updatePayload.followUpNotes = `[Bot Booking] ${appType} on ${appDate} at ${appTime} (Interest: ${botState.data.interest || "Plots"})`;

    // Notify CRM Admins and Sales Reps
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    const targetUserIds = [...admins.map(a => a.id)];
    if (lead.assignedToId && !targetUserIds.includes(lead.assignedToId)) {
      targetUserIds.push(lead.assignedToId);
    }

    if (targetUserIds.length > 0) {
      await prisma.notification.createMany({
        data: targetUserIds.map(uid => ({
          userId: uid,
          message: `🚗 Confirmed Appointment: ${lead.name} booked a ${appType} on ${appDate} (${appTime})!`
        }))
      }).catch(err => console.error("Notification error:", err.message));
    }
  }

  // Update lead in DB
  await prisma.lead.update({
    where: { id: lead.id },
    data: updatePayload
  });

  return {
    reply: botReply,
    nextStep,
    botData: botState.data,
    isAppointmentBooked
  };
}

module.exports = {
  SCRIPT_STEPS,
  processLeadScriptMessage
};
