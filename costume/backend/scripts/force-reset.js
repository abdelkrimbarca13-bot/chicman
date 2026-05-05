const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function reset() {
  await prisma.dailyCash.updateMany({ data: { initialCash: 0 } });
  console.log('Reset all initial cash to 0 - SUCCESS');
}
reset().finally(() => prisma.$disconnect());
