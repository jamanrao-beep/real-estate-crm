const express = require("express");
const { getMyNotifications, markNotificationRead } = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", getMyNotifications);
router.patch("/:id/read", markNotificationRead);

module.exports = router;
