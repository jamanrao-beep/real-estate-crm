const express = require("express");
const router = express.Router();
const { verifyWebhook, receiveLeadEvent } = require("../controllers/facebook");

router.get("/facebook", verifyWebhook);   // one-time verification
router.post("/facebook", receiveLeadEvent); // ongoing lead notifications

module.exports = router;
