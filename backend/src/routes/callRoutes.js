const express = require("express");
const router = express.Router();
const { logCall, getMyCalls, getAllCalls } = require("../controllers/callController");
const { requireAuth, adminOnly, salesOnly } = require("../middleware/auth");

router.post("/", requireAuth, salesOnly, logCall);
router.get("/mine", requireAuth, salesOnly, getMyCalls);
router.get("/", requireAuth, adminOnly, getAllCalls);

module.exports = router;
