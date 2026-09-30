const { Client } = require('pg');

const NEON_URL = "postgresql://neondb_owner:npg_bnQc5HfsJ2wt@ep-square-feather-a5cxd0tu-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function check() {
  const client = new Client({ connectionString: NEON_URL });
  await client.connect();

  const userRes = await client.query("SELECT id, name FROM \"User\" WHERE email LIKE '%aarti%'");
  const aarti = userRes.rows[0];

  const callsRes = await client.query("SELECT * FROM \"CallLog\" WHERE \"salesPersonId\" = $1", [aarti.id]);
  console.log(`Total calls made by ${aarti.name}: ${callsRes.rows.length}`);

  const counts = {};
  callsRes.rows.forEach(c => {
    counts[c.leadId] = (counts[c.leadId] || 0) + 1;
  });

  const multiCalls = Object.entries(counts).filter(([id, cnt]) => cnt > 1);
  console.log(`Distinct leads called: ${Object.keys(counts).length}`);
  console.log(`Leads called multiple times (follow-ups/call-backs): ${multiCalls.length}`);

  for (const [leadId, cnt] of multiCalls.slice(0, 5)) {
    const leadRes = await client.query("SELECT name, phone FROM \"Lead\" WHERE id = $1", [leadId]);
    const lead = leadRes.rows[0];
    console.log(`- Lead "${lead ? lead.name : 'Unknown'}" (${lead ? lead.phone : ''}): called ${cnt} times`);
  }

  await client.end();
}

check().catch(console.error);
