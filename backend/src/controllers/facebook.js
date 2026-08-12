const axios = require("axios");
const prisma = require("../prisma"); // Adjusted path to match where prisma.js is located

// STEP 1: Facebook calls this once (GET) when you register the webhook URL
// in Meta's developer console, to prove you own the endpoint.
function verifyWebhook(req, res) {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.FB_VERIFY_TOKEN) {
    console.log("Facebook webhook verified");
    return res.status(200).send(challenge); // echo the challenge back
  }

  return res.sendStatus(403);
}

// STEP 2: Facebook calls this (POST) every time someone submits a lead form.
// The payload is just IDs — we still have to fetch the real lead data.
async function receiveLeadEvent(req, res) {
  // Respond fast so Facebook doesn't retry/timeout — do the real work after.
  res.sendStatus(200);

  try {
    const entries = req.body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const leadgenId = change.value.leadgen_id;
        const formId = change.value.form_id;

        await fetchAndStoreLead(leadgenId, formId);
      }
    }
  } catch (err) {
    // Never let this throw back to Facebook — just log it.
    // Consider adding retry/alerting here for production.
    console.error("Failed to process Facebook lead event:", err.message);
  }
}

// Calls the Graph API to get the actual field data for a given leadgen_id,
// then inserts it as a new, unassigned Lead — exactly as the PRD specifies
// (all new leads land in the Admin Panel first, unassigned).
async function fetchAndStoreLead(leadgenId, formId) {
  const url = `https://graph.facebook.com/v19.0/${leadgenId}`;
  const response = await axios.get(url, {
    params: { access_token: process.env.FB_PAGE_ACCESS_TOKEN },
  });

  const fieldData = response.data.field_data || [];

  // field_data looks like: [{ name: "full_name", values: ["John Doe"] }, ...]
  const getField = (fieldName) =>
    fieldData.find((f) => f.name === fieldName)?.values?.[0] || null;

  const name = getField("full_name") || getField("name") || "Unknown";
  const phone = getField("phone_number") || getField("phone");
  const email = getField("email");

  await prisma.lead.create({
    data: {
      name,
      phone: phone || "",
      email,
      source: `Facebook Lead Ad (form ${formId})`,
      formAnswers: fieldData, // keep the raw answers too, in case you need other fields later
      dateReceived: new Date(),
      // assignedToId is intentionally left null — lands in Admin's unassigned inbox
    },
  });

  console.log(`New lead created from Facebook: ${name}`);
}

module.exports = { verifyWebhook, receiveLeadEvent }; 
