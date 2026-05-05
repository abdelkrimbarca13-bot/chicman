const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const days = await prisma.dailyCash.findMany({ orderBy: { date: 'desc' }, take: 5 });
  console.log(JSON.stringify(days, null, 2));
}
check().finally(() => prisma.$disconnect());
