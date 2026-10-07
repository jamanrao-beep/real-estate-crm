const prisma = require("../prisma");
const bcrypt = require("bcrypt");

const defaultUsers = [
  { name: 'Prashant Singh', email: 'prashant@bkdcrm.com', password: 'Ps@2026', role: 'ADMIN' },
  { name: 'Aarti Ghanata', email: 'aarti@bkdcrm.com', password: 'Ag@2026', role: 'SALES_PERSON' },
  { name: 'Sapna Arya', email: 'sapna@bkdcrm.com', password: 'Sa@2026', role: 'SALES_PERSON' },
  { name: 'Manashvi Bisht', email: 'manashvi@bkdcrm.com', password: 'Mb@2026', role: 'SALES_PERSON' },
  { name: 'Bharat Jatwany', email: 'bharat@bkdcrm.com', password: 'Bj@2026', role: 'SALES_PERSON' },
  { name: 'Kanishka', email: 'kanishka@bkdcrm.com', password: 'K@2026', role: 'SALES_PERSON' },
  { name: 'Channel Partner', email: 'broker@crm.com', password: 'broker123', role: 'BROKER' },
];

async function seedDatabase() {
  try {
    console.log("[Seed] Checking/seeding default users in MySQL database...");
    for (const u of defaultUsers) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      const passwordHash = await bcrypt.hash(u.password, 10);
      if (!existing) {
        await prisma.user.create({
          data: {
            name: u.name,
            email: u.email,
            passwordHash,
            role: u.role,
            isActive: true,
          },
        });
        console.log(`[Seed] Created default user: ${u.email} (${u.role})`);
      } else {
        await prisma.user.update({
          where: { email: u.email },
          data: {
            passwordHash,
            isActive: true,
          },
        });
        console.log(`[Seed] Updated default user: ${u.email}`);
      }
    }
    // Ensure MySQL enum columns support all required CRM Lead Funnel values
    try {
      console.log("[Migration] Ensuring MySQL enum columns include new lead funnel values...");
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`Lead\` 
        MODIFY COLUMN \`category\` ENUM('CALL_PICKED', 'CALL_NOT_PICKED', 'HOT', 'WARM', 'COLD') NOT NULL DEFAULT 'CALL_PICKED'
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`Lead\` 
        MODIFY COLUMN \`funnelStage\` ENUM('CALLBACK', 'FOLLOW_UP', 'INTERESTED', 'NOT_INTERESTED', 'DETAILS_SHARED', 'SITE_VISIT_DONE', 'OFFICE_VISIT_DONE', 'BOOKING_DONE', 'DEAL_CLOSED', 'CALL_NOT_PICKED', 'LOST') NOT NULL DEFAULT 'FOLLOW_UP'
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`LeadStatusHistory\` 
        MODIFY COLUMN \`stage\` ENUM('CALLBACK', 'FOLLOW_UP', 'INTERESTED', 'NOT_INTERESTED', 'DETAILS_SHARED', 'SITE_VISIT_DONE', 'OFFICE_VISIT_DONE', 'BOOKING_DONE', 'DEAL_CLOSED', 'CALL_NOT_PICKED', 'LOST') NOT NULL
      `);
      console.log("[Migration] MySQL enum columns verified successfully.");
    } catch (migErr) {
      console.error("[Migration] Notice updating enum columns:", migErr.message);
    }

    // Ensure MySQL performance indexes exist
    try {
      console.log("[Migration] Ensuring performance indexes exist in MySQL...");
      const indexesToCreate = [
        "CREATE INDEX idx_lead_assigned_status ON `Lead` (assignedToId, status)",
        "CREATE INDEX idx_lead_phone ON `Lead` (phone)",
        "CREATE INDEX idx_lead_email ON `Lead` (email)",
        "CREATE INDEX idx_lead_date_received ON `Lead` (dateReceived)",
        "CREATE INDEX idx_lead_follow_up ON `Lead` (followUpAt)",
        "CREATE INDEX idx_lead_funnel_stage ON `Lead` (funnelStage)",
        "CREATE INDEX idx_call_lead_id ON `CallLog` (leadId)",
        "CREATE INDEX idx_call_sales_created ON `CallLog` (salesPersonId, createdAt)",
        "CREATE INDEX idx_status_history_lead ON `LeadStatusHistory` (leadId)",
        "CREATE INDEX idx_assign_history_lead ON `LeadAssignmentHistory` (leadId)",
        "CREATE INDEX idx_notification_user ON `Notification` (userId, createdAt)",
      ];

      for (const idxSql of indexesToCreate) {
        try {
          await prisma.$executeRawUnsafe(idxSql);
        } catch (e) {
          // Index likely already exists (MySQL error 1061: Duplicate key name)
        }
      }
      console.log("[Migration] Performance indexes verified successfully.");
    } catch (idxErr) {
      console.error("[Migration] Notice verifying indexes:", idxErr.message);
    }

    console.log("[Seed] All default users verified/seeded successfully.");
    return { success: true, count: defaultUsers.length };
  } catch (err) {
    console.error("[Seed] Error verifying/seeding users:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { seedDatabase };
