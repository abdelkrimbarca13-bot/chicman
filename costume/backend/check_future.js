const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p = await prisma.payment.findMany({ where: { createdAt: { gte: new Date('2026-05-01') } } });
  console.log('Payments in May:', p.length);
  p.forEach(x => console.log(`Payment ID: ${x.id}, Date: ${x.createdAt.toISOString()}`));

  const e = await prisma.expense.findMany({ where: { date: { gte: new Date('2026-05-01') } } });
  console.log('Expenses in May:', e.length);
  e.forEach(x => console.log(`Expense ID: ${x.id}, Date: ${x.date.toISOString()}`));

  const w = await prisma.withdrawal.findMany({ where: { date: { gte: new Date('2026-05-01') } } });
  console.log('Withdrawals in May:', w.length);
  w.forEach(x => console.log(`Withdrawal ID: ${x.id}, Date: ${x.date.toISOString()}`));

  const s = await prisma.sale.findMany({ where: { createdAt: { gte: new Date('2026-05-01') } } });
  console.log('Sales in May:', s.length);
  s.forEach(x => console.log(`Sale ID: ${x.id}, Date: ${x.createdAt.toISOString()}`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
