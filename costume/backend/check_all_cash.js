const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const history = await prisma.dailyCash.findMany({
    orderBy: { date: 'desc' }
  });
  console.log('Total DailyCash records:', history.length);
  history.forEach(h => {
    console.log(`ID: ${h.id}, Date: ${h.date.toISOString()}, Balance: ${h.finalBalance}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
