const { Client } = require('pg');

const NEON_URL = "postgresql://neondb_owner:npg_bnQc5HfsJ2wt@ep-square-feather-a5cxd0tu-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function checkAllSalesCalls() {
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();

  const users = (await client.query('SELECT id, name, email FROM "User"')).rows;
  
  for (const u of users) {
    const callRes = await client.query('SELECT COUNT(*) as count FROM "CallLog" WHERE "salesPersonId" = $1', [u.id]);
    const leadRes = await client.query('SELECT COUNT(*) as count FROM "Lead" WHERE "assignedToId" = $1', [u.id]);
    console.log(`${u.name}: ${leadRes.rows[0].count} leads, ${callRes.rows[0].count} calls in Neon`);
  }

  await client.end();
}

checkAllSalesCalls().catch(console.error);
