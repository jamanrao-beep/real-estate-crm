const prisma = require("../prisma");

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
        await prisma.notification.create({
          data: {
            message: `Reminder: Time to follow up with lead ${lead.name} (${lead.phone})!`,
            userId: lead.assignedToId
          }
        });

        // Clear the followUpAt so we don't notify again
        await prisma.lead.update({
          where: { id: lead.id },
          data: { followUpAt: null }
        });
      }
    } catch (err) {
      console.error("Cron Job Error - Follow Ups:", err);
    }
  }, 60000); // 60,000 ms = 1 minute

  console.log("Cron jobs started.");
}

module.exports = { startCronJobs };
