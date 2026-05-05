const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function sum() {
  const allRentals = await prisma.payment.aggregate({ _sum: { amount: true } });
  const allSales = await prisma.sale.aggregate({ _sum: { totalAmount: true } });
  const allExpenses = await prisma.expense.aggregate({ _sum: { amount: true } });
  const allWithdrawals = await prisma.withdrawal.aggregate({ _sum: { amount: true } });
  
  console.log('All Rentals:', allRentals._sum.amount);
  console.log('All Sales:', allSales._sum.totalAmount);
  console.log('All Expenses:', allExpenses._sum.amount);
  console.log('All Withdrawals:', allWithdrawals._sum.amount);

  const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
  const dayStart = new Date(today);
  const daily = await prisma.dailyCash.findUnique({ where: { date: dayStart } });
  console.log('Today record:', JSON.stringify(daily, null, 2));
}
sum().finally(() => prisma.$disconnect());
