const express = require("express");
const router = express.Router();
const {
  createLead,
  getUnassignedLeads,
  getAllLeads,
  getMyLeads,
  assignLead,
  autoAssignLeads,
  markLeadLost,
  categorizeLead,
  updateFunnelStage,
  logAiChatMessage,
  scheduleFollowUp,
  syncSheetLeads,
  receiveWebhookLead,
  importBulkLeads,
  sendWhatsAppToLead,
} = require("../controllers/leadController");
const { requireAuth, adminOnly, salesOnly } = require("../middleware/auth");

// Lead Creation (Manual / Test lead from UI)
router.post("/", requireAuth, createLead);

// Google Sheet / Webhook / Bulk Import Endpoints
router.post("/sync-sheet", requireAuth, adminOnly, syncSheetLeads);
router.post("/webhook", receiveWebhookLead);
router.post("/import-bulk", requireAuth, adminOnly, importBulkLeads);

// WhatsApp Direct Bot Greeting
router.post("/:id/send-whatsapp", requireAuth, sendWhatsAppToLead);

// Admin-only endpoints
router.get("/unassigned", requireAuth, adminOnly, getUnassignedLeads);
router.get("/", requireAuth, adminOnly, getAllLeads);
router.patch("/:id/assign", requireAuth, adminOnly, assignLead);
router.post("/auto-assign", requireAuth, adminOnly, autoAssignLeads);

// Sales Person endpoint
router.get("/mine", requireAuth, salesOnly, getMyLeads);

// Shared endpoints — Sales Person (own leads only) or Admin (any lead).
// Ownership is checked inside each controller, not via role middleware.
router.patch("/:id/lost", requireAuth, markLeadLost);
router.patch("/:id/category", requireAuth, categorizeLead);
router.patch("/:id/stage", requireAuth, updateFunnelStage);
router.patch("/:id/ai-chat", logAiChatMessage); // AI service can call this without auth for now or with a separate API key
router.patch("/:id/follow-up", requireAuth, scheduleFollowUp);

module.exports = router;

