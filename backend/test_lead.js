require('dotenv').config();
const prisma = require('./src/prisma');

async function createTestLead() {
  const lead = await prisma.lead.create({
    data: {
      name: "Test User " + Math.floor(Math.random() * 1000),
      phone: "9876543210",
      email: "test@example.com",
      source: "Manual Test Script",
      dateReceived: new Date(),
      // Unassigned, goes to Admin Inbox
    },
  });
  console.log("✅ Successfully created unassigned test lead:");
  console.log(lead);
}

createTestLead()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
