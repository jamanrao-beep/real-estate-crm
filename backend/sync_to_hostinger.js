require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mariadb = require('mariadb');

async function syncToHostinger() {
  const sql = fs.readFileSync(path.join(__dirname, 'restore_neon_assignments.sql'), 'utf-8');
  const connectionUrl = (process.env.DATABASE_URL || '').replace(/^mysql:\/\//i, 'mariadb://');

  console.log("Connecting to Hostinger MySQL...");
  const conn = await mariadb.createConnection({
    host: '82.25.121.152',
    user: 'u580210733_crmbkd',
    password: decodeURIComponent('BkdCrm%402026Secure%21'),
    database: 'u580210733_crmbkd',
    port: 3306,
    multipleStatements: true,
    connectTimeout: 10000
  });

  console.log("Connected successfully to Hostinger! Executing restoration SQL...");
  const result = await conn.query(sql);
  console.log("SQL executed successfully!");

  const verification = await conn.query(`
    SELECT u.name as SalesPerson, COUNT(l.id) as TotalLeadsAssigned
    FROM \`User\` u
    LEFT JOIN \`Lead\` l ON l.assignedToId = u.id
    GROUP BY u.id, u.name;
  `);

  console.log("\n=== HOSTINGER RESTORED ASSIGNMENTS ===");
  console.table(verification);

  await conn.end();
}

syncToHostinger().catch(err => {
  console.error("Sync error:", err);
});
