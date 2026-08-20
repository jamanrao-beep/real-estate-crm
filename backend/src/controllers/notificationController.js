const prisma = require("../prisma");

// GET /api/notifications
async function getMyNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId, isRead: false },
      orderBy: { createdAt: "desc" },
    });
    return res.json(notifications);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
}

// PATCH /api/notifications/:id/read
async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    if (notification.userId !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to mark notification as read" });
  }
}

module.exports = {
  getMyNotifications,
  markNotificationRead,
};
