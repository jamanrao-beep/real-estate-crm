const { Client } = require('pg');

const NEON_URL = "postgresql://neondb_owner:npg_bnQc5HfsJ2wt@ep-square-feather-a5cxd0tu-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function checkAllNeonTables() {
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();

  const tables = [
    'LeadAssignmentHistory',
    'LeadStatusHistory',
    'CallLog',
    'Deal',
    'Transaction',
    'Notification'
  ];

  for (const t of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) as count FROM "${t}"`);
      console.log(`Neon "${t}": ${res.rows[0].count} rows`);
    } catch (e) {
      console.log(`Neon "${t}": Error - ${e.message}`);
    }
  }

  // Check some dates in LeadAssignmentHistory
  const lahSample = await client.query(`SELECT * FROM "LeadAssignmentHistory" LIMIT 3`);
  console.log("\nSample LeadAssignmentHistory:", lahSample.rows);

  // Check some dates in Lead
  const leadSample = await client.query(`SELECT id, name, "dateReceived", "createdAt", "updatedAt" FROM "Lead" LIMIT 3`);
  console.log("\nSample Lead dates:", leadSample.rows);

  await client.end();
}

checkAllNeonTables().catch(console.error);
