const prisma = require("../prisma");
const bcrypt = require("bcrypt");

const defaultUsers = [
  { name: 'Prashant Singh', email: 'prashant@bkdcrm.com', password: 'Ps@2026', role: 'ADMIN' },
  { name: 'Aarti Ghanata', email: 'aarti@bkdcrm.com', password: 'Ag@2026', role: 'SALES_PERSON' },
  { name: 'Sapna Arya', email: 'sapna@bkdcrm.com', password: 'Sa@2026', role: 'SALES_PERSON' },
  { name: 'Manashvi Bisht', email: 'manashvi@bkdcrm.com', password: 'Mb@2026', role: 'SALES_PERSON' },
  { name: 'Bharat Jatwany', email: 'bharat@bkdcrm.com', password: 'Bj@2026', role: 'SALES_PERSON' },
  { name: 'Kanishka', email: 'kanishka@bkdcrm.com', password: 'K@2026', role: 'SALES_PERSON' },
  { name: 'Channel Partner', email: 'broker@crm.com', password: 'broker123', role: 'BROKER' },
];

async function seedDatabase() {
  try {
    console.log("[Seed] Checking/seeding default users in MySQL database...");
    for (const u of defaultUsers) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      const passwordHash = await bcrypt.hash(u.password, 10);
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
        console.log(`[Seed] Created default user: ${u.email} (${u.role})`);
      } else {
        await prisma.user.update({
          where: { email: u.email },
          data: {
            passwordHash,
            isActive: true,
          },
        });
        console.log(`[Seed] Updated default user: ${u.email}`);
      }
    }
    console.log("[Seed] All default users verified/seeded successfully.");
    return { success: true, count: defaultUsers.length };
  } catch (err) {
    console.error("[Seed] Error verifying/seeding users:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { seedDatabase };
