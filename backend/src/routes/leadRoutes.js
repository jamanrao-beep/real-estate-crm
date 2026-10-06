const express = require("express");
const router = express.Router();
const {
  createLead,
  getUnassignedLeads,
  getAllLeads,
  getMyLeads,
  getLeadById,
  getTodayFollowUps,
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
  addLeadNote,
  updateLeadNote,
  deleteLeadNote,
} = require("../controllers/leadController");
const { requireAuth, adminOnly, salesOnly } = require("../middleware/auth");

// Lead Creation (Manual / Test lead from UI)
router.post("/", requireAuth, createLead);

// Google Sheet / Webhook / Bulk Import Endpoints
router.post("/sync-sheet", requireAuth, adminOnly, syncSheetLeads);
router.post("/webhook", receiveWebhookLead);
router.post("/import-bulk", requireAuth, adminOnly, importBulkLeads);

// Follow-ups endpoints (Dedicated workspace - Sales Person gets their own; Admin gets team-wide)
router.get("/follow-ups", requireAuth, getTodayFollowUps);

// Admin-only endpoints
router.get("/unassigned", requireAuth, adminOnly, getUnassignedLeads);
router.get("/", requireAuth, adminOnly, getAllLeads);
router.patch("/:id/assign", requireAuth, adminOnly, assignLead);
router.post("/auto-assign", requireAuth, adminOnly, autoAssignLeads);

// Sales Person endpoint
router.get("/mine", requireAuth, salesOnly, getMyLeads);

// Single lead endpoint (strict ownership checked inside controller)
router.get("/:id", requireAuth, getLeadById);

// Shared endpoints — Sales Person or Admin.
router.patch("/:id/lost", requireAuth, markLeadLost);
router.patch("/:id/category", requireAuth, categorizeLead);
router.patch("/:id/stage", requireAuth, updateFunnelStage);
router.patch("/:id/ai-chat", logAiChatMessage); // AI service can call this without auth for now or with a separate API key
router.patch("/:id/follow-up", requireAuth, scheduleFollowUp);

// Note management endpoints
router.post("/:id/notes", requireAuth, addLeadNote);
router.patch("/:id/notes", requireAuth, updateLeadNote);
router.delete("/:id/notes", requireAuth, deleteLeadNote);

module.exports = router;

