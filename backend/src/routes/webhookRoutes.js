const express = require("express");
const router = express.Router();
const { verifyWebhook, receiveLeadEvent } = require("../controllers/facebook");
const { receiveChatMitraWebhook } = require("../controllers/chatmitraWebhook");

// Facebook Meta Lead Webhook
router.get("/facebook", verifyWebhook);   // one-time verification
router.post("/facebook", receiveLeadEvent); // ongoing lead notifications

// ChatMitra WhatsApp Webhook
router.get("/chatmitra", (req, res) => res.status(200).send("ChatMitra webhook endpoint active"));
router.post("/chatmitra", receiveChatMitraWebhook);

module.exports = router;
