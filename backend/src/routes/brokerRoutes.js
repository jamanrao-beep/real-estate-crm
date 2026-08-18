const express = require("express");
const router = express.Router();
const { getMyLeads, submitLead } = require("../controllers/brokerController");
const { requireAuth, brokerOnly } = require("../middleware/auth");

// All broker routes require the BROKER role
router.use(requireAuth, brokerOnly);

router.get("/leads", getMyLeads);
router.post("/leads", submitLead);

module.exports = router;
