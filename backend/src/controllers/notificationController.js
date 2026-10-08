const prisma = require("../prisma");

// GET /api/notifications
async function getMyNotifications(req, res) {
  try {
    // Auto-clean stale "Deal Closed" notifications if the lead is not actually in DEAL_CLOSED stage
    const dealNotifs = await prisma.notification.findMany({
      where: {
        userId: req.user.userId,
        isRead: false,
        message: { startsWith: "Deal Closed:" },
      },
    });

    if (dealNotifs.length > 0) {
      for (const n of dealNotifs) {
        const match = n.message.match(/finalized a deal with (.+?)\.?$/);
        if (match && match[1]) {
          const leadName = match[1].trim().replace(/\.$/, "");
          const lead = await prisma.lead.findFirst({
            where: { name: leadName },
            select: { funnelStage: true },
          });
          if (lead && lead.funnelStage !== "DEAL_CLOSED") {
            await prisma.notification.delete({ where: { id: n.id } }).catch(() => {});
          }
        }
      }
    }

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
