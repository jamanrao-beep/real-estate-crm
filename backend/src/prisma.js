require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const mariadb = require('mariadb');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const connectionUrl = (process.env.DATABASE_URL || '').replace(/^mysql:\/\//i, 'mariadb://');
const pool = mariadb.createPool(connectionUrl);
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;

