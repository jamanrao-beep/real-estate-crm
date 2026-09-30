require('dotenv').config();
const { Client } = require('pg');
const prisma = require('./src/prisma');

const NEON_URL = "postgresql://neondb_owner:npg_bnQc5HfsJ2wt@ep-square-feather-a5cxd0tu-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function inspect() {
  console.log("=== 1. Connecting to Neon PostgreSQL ===");
  const pgClient = new Client({ connectionString: NEON_URL });
  await pgClient.connect();
  console.log("Connected to Neon successfully!");

  // Check tables in Neon
  const tablesRes = await pgClient.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  console.log("Tables in Neon:", tablesRes.rows.map(r => r.table_name));

  // Find User table name
  const userTableName = tablesRes.rows.find(r => r.table_name.toLowerCase() === 'user')?.table_name || 'User';
  const leadTableName = tablesRes.rows.find(r => r.table_name.toLowerCase() === 'lead')?.table_name || 'Lead';

  console.log(`Using Neon tables: "${userTableName}", "${leadTableName}"`);

  // Fetch Neon Users
  const neonUsersRes = await pgClient.query(`SELECT id, name, email, role FROM "${userTableName}"`);
  console.log(`\n=== Neon Users (${neonUsersRes.rows.length}) ===`);
  console.table(neonUsersRes.rows.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));

  // Fetch Hostinger Users
  console.log("\n=== 2. Connecting to Hostinger MySQL via Prisma ===");
  const hostingerUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log(`Hostinger Users (${hostingerUsers.length}):`);
  console.table(hostingerUsers);

  // Fetch Neon Leads
  const neonLeadsRes = await pgClient.query(`
    SELECT id, name, phone, email, "assignedToId", "brokerId", "category", "funnelStage", "createdAt" 
    FROM "${leadTableName}"
  `);
  const neonLeads = neonLeadsRes.rows;
  console.log(`\n=== Neon Leads (${neonLeads.length}) ===`);

  const assignedInNeon = neonLeads.filter(l => l.assignedToId);
  const unassignedInNeon = neonLeads.filter(l => !l.assignedToId);
  console.log(`Total Neon Leads: ${neonLeads.length}`);
  console.log(`Assigned in Neon: ${assignedInNeon.length}`);
  console.log(`Unassigned in Neon: ${unassignedInNeon.length}`);

  // Fetch Hostinger Leads
  const hostingerLeads = await prisma.lead.findMany({
    select: { id: true, name: true, phone: true, email: true, assignedToId: true, brokerId: true }
  });
  console.log(`\n=== Hostinger Leads (${hostingerLeads.length}) ===`);

  // Build User Map from Neon ID -> Neon User -> Hostinger User ID
  const neonUserMap = new Map(neonUsersRes.rows.map(u => [u.id, u]));
  const hostingerUserByEmail = new Map(hostingerUsers.map(u => [u.email.toLowerCase().trim(), u]));
  const hostingerUserByName = new Map(hostingerUsers.map(u => [u.name.toLowerCase().trim(), u]));

  console.log("\n=== User Mapping (Neon -> Hostinger) ===");
  for (const nu of neonUsersRes.rows) {
    const matchedByEmail = hostingerUserByEmail.get(nu.email.toLowerCase().trim());
    const matchedByName = hostingerUserByName.get(nu.name.toLowerCase().trim());
    const target = matchedByEmail || matchedByName;
    console.log(`Neon User: "${nu.name}" (${nu.email}) -> Hostinger User: ${target ? `"${target.name}" (${target.id})` : 'NOT FOUND!'}`);
  }

  // Check matching leads between Neon and Hostinger by phone
  const cleanPhone = (p) => {
    if (!p) return '';
    return p.toString().replace(/[^0-9]/g, '').slice(-10); // last 10 digits
  };

  const hostingerLeadByPhone = new Map();
  for (const hl of hostingerLeads) {
    const p = cleanPhone(hl.phone);
    if (p) hostingerLeadByPhone.set(p, hl);
  }

  let matchedLeadsCount = 0;
  let missingInHostinger = 0;
  const sampleReassignments = [];

  for (const nl of neonLeads) {
    const p = cleanPhone(nl.phone);
    const hl = hostingerLeadByPhone.get(p);
    if (hl) {
      matchedLeadsCount++;
      const neonAssignee = nl.assignedToId ? neonUserMap.get(nl.assignedToId) : null;
      if (sampleReassignments.length < 10) {
        sampleReassignments.push({
          leadName: nl.name,
          phone: nl.phone,
          neonAssignedTo: neonAssignee ? neonAssignee.name : 'Unassigned',
          hostingerCurrentAssignedToId: hl.assignedToId || 'Unassigned'
        });
      }
    } else {
      missingInHostinger++;
    }
  }

  console.log(`\n=== Lead Matching Summary ===`);
  console.log(`Neon Leads Matched in Hostinger (by last 10 digits of phone): ${matchedLeadsCount} / ${neonLeads.length}`);
  console.log(`Neon Leads not in Hostinger: ${missingInHostinger}`);

  console.log("\n=== Sample 10 Leads & Their Neon Manual Assignments ===");
  console.table(sampleReassignments);

  await pgClient.end();
  await prisma.$disconnect();
}

inspect().catch(err => {
  console.error("Error inspecting:", err);
  process.exit(1);
});
