const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const NEON_URL = "postgresql://neondb_owner:npg_bnQc5HfsJ2wt@ep-square-feather-a5cxd0tu-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function dumpNeonData() {
  console.log("Connecting to Neon...");
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();

  console.log("Fetching users from Neon...");
  const usersRes = await client.query('SELECT * FROM "User"');
  console.log(`Found ${usersRes.rows.length} users.`);

  console.log("Fetching leads from Neon...");
  const leadsRes = await client.query('SELECT * FROM "Lead" ORDER BY "createdAt" ASC');
  console.log(`Found ${leadsRes.rows.length} leads.`);

  let assignmentHistory = [];
  try {
    const historyRes = await client.query('SELECT * FROM "LeadAssignmentHistory"');
    assignmentHistory = historyRes.rows;
    console.log(`Found ${assignmentHistory.length} assignment history records.`);
  } catch (e) {
    console.log("No LeadAssignmentHistory table or query failed:", e.message);
  }

  // Create user lookup
  const userMap = {};
  usersRes.rows.forEach(u => {
    userMap[u.id] = { id: u.id, name: u.name, email: u.email, role: u.role };
  });

  // Calculate stats
  const assignedCounts = {};
  let totalAssigned = 0;
  let totalUnassigned = 0;

  leadsRes.rows.forEach(lead => {
    if (lead.assignedToId && userMap[lead.assignedToId]) {
      const userName = userMap[lead.assignedToId].name;
      assignedCounts[userName] = (assignedCounts[userName] || 0) + 1;
      totalAssigned++;
    } else {
      totalUnassigned++;
    }
  });

  console.log("\n=== NEON ASSIGNMENT BREAKDOWN ===");
  console.table(assignedCounts);
  console.log(`Total Leads: ${leadsRes.rows.length}`);
  console.log(`Total Assigned: ${totalAssigned}`);
  console.log(`Total Unassigned: ${totalUnassigned}`);

  const backupData = {
    exportedAt: new Date().toISOString(),
    users: usersRes.rows,
    leads: leadsRes.rows,
    assignmentHistory: assignmentHistory,
    stats: {
      totalLeads: leadsRes.rows.length,
      totalAssigned,
      totalUnassigned,
      assignedCounts
    }
  };

  const backupPath = path.join(__dirname, 'neon_dump.json');
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`\nSuccessfully backed up all Neon data to ${backupPath}!`);

  await client.end();
}

dumpNeonData().catch(err => {
  console.error("Neon dump error:", err);
  process.exit(1);
});
