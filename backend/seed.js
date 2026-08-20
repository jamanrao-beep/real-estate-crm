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
  // Seed Admin
  let admin = await prisma.user.findUnique({ where: { email: 'admin@crm.com' } });
  if (!admin) {
    admin = await prisma.user.create({
      data: { name: 'System Admin', email: 'admin@crm.com', passwordHash: await bcrypt.hash('admin123', 10), role: 'ADMIN' },
    });
    console.log('Admin user created successfully: admin@crm.com / admin123');
  }

  // Seed 4 Sales Persons
  for (let i = 1; i <= 4; i++) {
    const email = `sales${i}@crm.com`;
    let sales = await prisma.user.findUnique({ where: { email } });
    if (!sales) {
      await prisma.user.create({
        data: { 
          name: `Sales ${i}`, 
          email, 
          passwordHash: await bcrypt.hash('sales123', 10), 
          role: 'SALES_PERSON' 
        },
      });
      console.log(`Sales user created successfully: ${email} / sales123`);
    }
  }

  // Seed Broker
  let broker = await prisma.user.findUnique({ where: { email: 'broker@crm.com' } });
  if (!broker) {
    broker = await prisma.user.create({
      data: { name: 'Channel Partner', email: 'broker@crm.com', passwordHash: await bcrypt.hash('broker123', 10), role: 'BROKER' },
    });
    console.log('Broker user created successfully: broker@crm.com / broker123');
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
