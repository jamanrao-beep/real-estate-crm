const prisma = require("../prisma");

/**
 * Persistently records every action performed by sales persons (and admins)
 * into CallLog with exact server timestamps and user identification.
 * 
 * Ensures an immutable audit trail for:
 * - Adding, updating, and deleting notes
 * - Stage and category changes
 * - Scheduling and clearing follow-ups
 * - Logging calls and visits
 * - Marking leads as lost
 * 
 * @param {Object} params
 * @param {string} params.leadId - Target lead ID
 * @param {string} params.userId - Actor user ID
 * @param {string} params.action - Action identifier e.g. "NOTE_ADDED", "NOTE_EDITED", "NOTE_DELETED", "STAGE_CHANGED", "CATEGORY_CHANGED", "FOLLOW_UP_SCHEDULED", "FOLLOW_UP_CLEARED", "CALL_LOGGED", "LEAD_LOST"
 * @param {string} params.details - Full detail of the action taken (before/after values, note texts, reasons)
 */
async function recordLeadAction({ leadId, userId, action, details }) {
  try {
    if (!leadId || !userId) return;

    const now = new Date();
    const istTime = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    let actorDesc = "User " + userId;
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, role: true },
      });
      if (user) {
        actorDesc = `${user.name} (${user.role})`;
      }
    } catch {
      // Continue even if user lookup encounters connection issue
    }

    const auditNotes = `[AUDIT: ${action}] by ${actorDesc} at ${istTime} IST | ${details}`;

    await prisma.callLog.create({
      data: {
        leadId,
        salesPersonId: userId,
        startTime: now,
        endTime: now,
        durationSecs: 0,
        notes: auditNotes,
      },
    });
  } catch (err) {
    console.error(`[AuditLogger] Failed to log action ${action}:`, err.message);
  }
}

module.exports = { recordLeadAction };
