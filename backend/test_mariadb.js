require('dotenv').config();
const mariadb = require('mariadb');

async function test() {
  const connectionUrl = (process.env.DATABASE_URL || '').replace(/^mysql:\/\//i, 'mariadb://');
  console.log("Connecting to:", connectionUrl.replace(/:[^:@]+@/, ':***@'));
  try {
    const conn = await mariadb.createConnection(connectionUrl);
    console.log("Connected successfully to Hostinger MySQL!");
    const rows = await conn.query("SELECT COUNT(*) as count FROM User");
    console.log("User count in Hostinger:", rows);
    await conn.end();
  } catch (err) {
    console.error("Direct MariaDB connection error:", err);
  }
}

test();
