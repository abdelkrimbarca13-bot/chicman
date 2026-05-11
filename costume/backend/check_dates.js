const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const history = await prisma.dailyCash.findMany({
    orderBy: { date: 'desc' },
    take: 10
  });
  console.log('DailyCash History:');
  history.forEach(h => {
    console.log(`ID: ${h.id}, Date: ${h.date.toISOString()}, Balance: ${h.finalBalance}`);
  });

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('\nRecent Payments:');
  payments.forEach(p => {
    console.log(`ID: ${p.id}, CreatedAt: ${p.createdAt.toISOString()}, Amount: ${p.amount}`);
  });

  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    take: 5
  });
  console.log('\nRecent Expenses:');
  expenses.forEach(e => {
    console.log(`ID: ${e.id}, Date: ${e.date.toISOString()}, Amount: ${e.amount}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
