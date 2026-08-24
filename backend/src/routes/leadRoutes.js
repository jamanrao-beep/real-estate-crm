const express = require("express");
const router = express.Router();
const {
  getUnassignedLeads,
  getAllLeads,
  getMyLeads,
  assignLead,
  autoAssignLeads,
  markLeadLost,
  categorizeLead,
  categorizeLead,
  updateFunnelStage,
  logAiChatMessage,
  scheduleFollowUp,
} = require("../controllers/leadController");
const { requireAuth, adminOnly, salesOnly } = require("../middleware/auth");

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
