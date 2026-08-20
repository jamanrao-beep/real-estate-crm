const express = require("express");
const { getMyNotifications, markNotificationRead } = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/", getMyNotifications);
router.patch("/:id/read", markNotificationRead);

module.exports = router;
