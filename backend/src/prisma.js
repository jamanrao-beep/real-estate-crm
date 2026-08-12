// Reusing one PrismaClient instance across the whole app avoids
// exhausting your database's connection limit during development
// (hot-reloading would otherwise create a new client every time).

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma; 
