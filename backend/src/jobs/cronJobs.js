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
        // Create a notification for the sales person
        const noteDetail = lead.followUpNotes ? ` | Note: "${lead.followUpNotes}"` : "";
        await prisma.notification.create({
          data: {
            message: `Reminder: Time to follow up with lead ${lead.name} (${lead.phone})${noteDetail}!`,
            userId: lead.assignedToId
          }
        });

        // Clear the followUpAt so we don't notify again
        await prisma.lead.update({
          where: { id: lead.id },
          data: { followUpAt: null, followUpNotes: null }
        });
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
