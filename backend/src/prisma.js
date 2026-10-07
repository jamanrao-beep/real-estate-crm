require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const mariadb = require('mariadb');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

let pool;
try {
  const dbUrl = (process.env.DATABASE_URL || '').replace(/^mysql:\/\//i, 'http://');
  const parsed = new URL(dbUrl);
  pool = mariadb.createPool({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ''),
    connectTimeout: 15000,
    acquireTimeout: 20000,
    connectionLimit: 15,
    minimumIdle: 2,
    idleTimeout: 30000,
    compress: true,
  });
} catch (e) {
  const connectionUrl = (process.env.DATABASE_URL || '').replace(/^mysql:\/\//i, 'mariadb://');
  pool = mariadb.createPool(connectionUrl);
}

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;

