const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  
  const dailyCash = await prisma.dailyCash.findMany({ where: { date: { gt: now } } });
  console.log('Future DailyCash:', dailyCash.length);
  dailyCash.forEach(d => console.log(`DailyCash ID: ${d.id}, Date: ${d.date.toISOString()}`));

  const payments = await prisma.payment.findMany({ where: { createdAt: { gt: now } } });
  console.log('Future Payments:', payments.length);
  payments.forEach(p => console.log(`Payment ID: ${p.id}, Date: ${p.createdAt.toISOString()}`));

  const rentals = await prisma.rental.findMany({ where: { startDate: { gt: now } } });
  console.log('Future Rentals (Start):', rentals.length);
  rentals.forEach(r => console.log(`Rental ID: ${r.id}, StartDate: ${r.startDate.toISOString()}`));

  const expenses = await prisma.expense.findMany({ where: { date: { gt: now } } });
  console.log('Future Expenses:', expenses.length);
  expenses.forEach(e => console.log(`Expense ID: ${e.id}, Date: ${e.date.toISOString()}`));

  const withdrawals = await prisma.withdrawal.findMany({ where: { date: { gt: now } } });
  console.log('Future Withdrawals:', withdrawals.length);
  withdrawals.forEach(w => console.log(`Withdrawal ID: ${w.id}, Date: ${w.date.toISOString()}`));

  const auditLogs = await prisma.auditLog.findMany({ where: { createdAt: { gt: now } } });
  console.log('Future AuditLogs:', auditLogs.length);
  auditLogs.forEach(l => console.log(`AuditLog ID: ${l.id}, Date: ${l.createdAt.toISOString()}`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
