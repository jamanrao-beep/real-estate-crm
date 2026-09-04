require('dotenv').config();
const { Pool } = require('pg');

async function checkDatabase() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('\n🔍 Connecting to Database...');
    const url = new URL(process.env.DATABASE_URL);
    console.log(`🌐 Host: ${url.hostname}`);
    console.log(`📁 Database: ${url.pathname.replace('/', '')}`);
    
    // Check server info
    const versionRes = await pool.query('SELECT version();');
    console.log(`⚙️  PostgreSQL Version: ${versionRes.rows[0].version.split(',')[0]}`);
    
    // Check tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\n📋 Created Tables in Neon:');
    tablesRes.rows.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Check users
    const usersRes = await pool.query('SELECT name, email, role FROM "User" ORDER BY role, name;');
    console.log(`\n👥 Seeded Users (${usersRes.rows.length} total):`);
    console.table(usersRes.rows);
    
    console.log('✅ Confirmed: You are connected to your live Neon database!\n');
  } catch (err) {
    console.error('❌ Connection error:', err.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
