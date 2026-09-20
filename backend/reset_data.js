require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetData() {
  try {
    console.log('--- Current Counts Before Cleanup ---');
    console.log({
      users: await prisma.user.count(),
      leads: await prisma.lead.count(),
      deals: await prisma.deal.count(),
      transactions: await prisma.transaction.count(),
      callLogs: await prisma.callLog.count(),
      leadAssignmentHistory: await prisma.leadAssignmentHistory.count(),
      leadStatusHistory: await prisma.leadStatusHistory.count(),
      notifications: await prisma.notification.count(),
    });

    console.log('\nCleaning test data while preserving all user accounts and email IDs...');

    await prisma.$transaction([
      prisma.transaction.deleteMany({}),
      prisma.deal.deleteMany({}),
      prisma.callLog.deleteMany({}),
      prisma.leadStatusHistory.deleteMany({}),
      prisma.leadAssignmentHistory.deleteMany({}),
      prisma.notification.deleteMany({}),
      prisma.lead.deleteMany({}),
    ]);

    console.log('\n--- Counts After Cleanup ---');
    const finalCounts = {
      users: await prisma.user.count(),
      leads: await prisma.lead.count(),
      deals: await prisma.deal.count(),
      transactions: await prisma.transaction.count(),
      callLogs: await prisma.callLog.count(),
      leadAssignmentHistory: await prisma.leadAssignmentHistory.count(),
      leadStatusHistory: await prisma.leadStatusHistory.count(),
      notifications: await prisma.notification.count(),
    };
    console.log(JSON.stringify(finalCounts, null, 2));

    const users = await prisma.user.findMany({
      select: { name: true, email: true, role: true, isActive: true },
      orderBy: { role: 'asc' },
    });
    console.log('\nPreserved User Accounts:');
    console.table(users);

    console.log('\n✅ Successfully wiped all test leads, payments, deals, logs & notifications. Database is now reset to 0!');
  } catch (err) {
    console.error('❌ Error resetting data:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

resetData();
