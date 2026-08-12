const express = require("express");
const router = express.Router();
const {
  getUnassignedLeads,
  getAllLeads,
  getMyLeads,
  assignLead,
  autoAssignLeads,
} = require("../controllers/leadController");
const { requireAuth, adminOnly, salesOnly } = require("../middleware/auth");

// Admin-only endpoints
router.get("/unassigned", requireAuth, adminOnly, getUnassignedLeads);
router.get("/", requireAuth, adminOnly, getAllLeads);
router.patch("/:id/assign", requireAuth, adminOnly, assignLead);
router.post("/auto-assign", requireAuth, adminOnly, autoAssignLeads);

// Sales Person endpoint
router.get("/mine", requireAuth, salesOnly, getMyLeads);

module.exports = router;
