const prisma = require("../prisma");
const { syncGoogleSheetLeads } = require("../services/googleSheetSync");

function startCronJobs() {
  // Check for follow-ups every 1 minute
  setInterval(async () => {
    try {
      const now = new Date();
      // Find leads with followUpAt in the past, that haven't been cleared
      const leadsToFollowUp = await prisma.lead.findMany({
        where: {
          followUpAt: {
            lte: now
          },
          assignedToId: {
            not: null
          }
        }
      });

      for (const lead of leadsToFollowUp) {
        // Check if notification already sent in the last 12 hours for this lead
        const recentNotif = await prisma.notification.findFirst({
          where: {
            userId: lead.assignedToId,
            message: { contains: `lead ${lead.name} (${lead.phone})` },
            createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
          },
        });

        if (!recentNotif) {
          const noteDetail = lead.followUpNotes ? ` | Note: "${lead.followUpNotes}"` : "";
          await prisma.notification.create({
            data: {
              message: `Reminder: Time to follow up with lead ${lead.name} (${lead.phone})${noteDetail}!`,
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
