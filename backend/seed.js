require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = [
    // Admin
    {
      name: 'Prashant Singh',
      email: 'prashant@bkdcrm.com',
      password: 'Ps@2026',
      role: 'ADMIN',
    },
    // Sales Persons
    {
      name: 'Aarti Ghanata',
      email: 'aarti@bkdcrm.com',
      password: 'Ag@2026',
      role: 'SALES_PERSON',
    },
    {
      name: 'Sapna Arya',
      email: 'sapna@bkdcrm.com',
      password: 'Sa@2026',
      role: 'SALES_PERSON',
    },
    {
      name: 'Manashvi Bisht',
      email: 'manashvi@bkdcrm.com',
      password: 'Mb@2026',
      role: 'SALES_PERSON',
    },
    {
      name: 'Bharat Jatwany',
      email: 'bharat@bkdcrm.com',
      password: 'Bj@2026',
      role: 'SALES_PERSON',
    },
    // Broker
    {
      name: 'Channel Partner',
      email: 'broker@crm.com',
      password: 'broker123',
      role: 'BROKER',
    },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role,
          isActive: true,
        },
      });
      console.log(`Created user: ${u.name} (${u.email}) [${u.role}]`);
    } else {
      await prisma.user.update({
        where: { email: u.email },
        data: {
          name: u.name,
          passwordHash,
          role: u.role,
          isActive: true,
        },
      });
      console.log(`Updated user: ${u.name} (${u.email}) [${u.role}]`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
