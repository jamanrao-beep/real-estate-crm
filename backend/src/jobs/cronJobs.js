const prisma = require("../prisma");
const { syncGoogleSheetLeads } = require("../services/googleSheetSync");

function startCronJobs() {
  // Check for follow-ups every 1 minute
  setInterval(async () => {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

      // Find active leads with followUpAt within the last 24 hours
      const leadsToFollowUp = await prisma.lead.findMany({
        where: {
          followUpAt: {
            lte: now,
            gte: twentyFourHoursAgo,
          },
          assignedToId: {
            not: null,
          },
        },
      });

      if (leadsToFollowUp.length === 0) return;

      // Pre-fetch all notifications sent in the last 12 hours in ONE batch query
      const recentNotifs = await prisma.notification.findMany({
        where: {
          createdAt: { gte: twelveHoursAgo },
        },
        select: { userId: true, message: true },
      });
      const notifKeySet = new Set(recentNotifs.map((n) => `${n.userId}::${n.message}`));

      for (const lead of leadsToFollowUp) {
        const noteDetail = lead.followUpNotes ? ` | Note: "${lead.followUpNotes}"` : "";
        const expectedMessage = `Reminder: Time to follow up with lead ${lead.name} (${lead.phone})${noteDetail}!`;
        const key = `${lead.assignedToId}::${expectedMessage}`;

        if (!notifKeySet.has(key)) {
          notifKeySet.add(key);
          await prisma.notification.create({
            data: {
              message: expectedMessage,
              userId: lead.assignedToId,
            },
          });
        }
        // Do NOT wipe followUpAt or followUpNotes! They must remain intact for Today's Follow-ups workspace.
      }
    } catch (err) {
      console.error("Cron Job Error - Follow Ups:", err);
    }
  }, 60000); // 60,000 ms = 1 minute

  // Google Sheet Auto-Sync: Runs every 2 minutes
  const runSheetSync = async () => {
    try {
      const res = await syncGoogleSheetLeads();
      if (res.synced > 0) {
        console.log(`[AutoSync] Synced ${res.synced} new leads from Google Sheet.`);
      }
    } catch (err) {
      console.error("[AutoSync] Sheet sync error:", err.message);
    }
  };

  // Run initial sync 5 seconds after startup
  setTimeout(runSheetSync, 5000);
  // Then run every 2 minutes
  setInterval(runSheetSync, 120000);

  console.log("Cron jobs started (Follow-ups & Google Sheet Sync).");
}

module.exports = { startCronJobs };
