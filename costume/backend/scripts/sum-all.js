const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function sum() {
  const allRentals = await prisma.payment.aggregate({ _sum: { amount: true } });
  const allSales = await prisma.sale.aggregate({ _sum: { totalAmount: true } });
  const allPerfumeSales = await prisma.perfumeSale.aggregate({ _sum: { totalAmount: true } });
  const allProductSales = await prisma.productSale.aggregate({ _sum: { totalAmount: true } });
  const allExpenses = await prisma.expense.aggregate({ _sum: { amount: true } });
  const allWithdrawals = await prisma.withdrawal.aggregate({ _sum: { amount: true } });
  
  console.log('All Rentals (Payments):', allRentals._sum.amount || 0);
  console.log('All Sales (Costumes):', allSales._sum.totalAmount || 0);
  console.log('All Perfume Sales:', allPerfumeSales._sum.totalAmount || 0);
  console.log('All Product Sales:', allProductSales._sum.totalAmount || 0);
  console.log('All Expenses:', allExpenses._sum.amount || 0);
  console.log('All Withdrawals:', allWithdrawals._sum.amount || 0);

  const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
  const dayStart = new Date(today);
  const daily = await prisma.dailyCash.findUnique({ where: { date: dayStart } });
  console.log('Today record:', JSON.stringify(daily, null, 2));
}
sum().finally(() => prisma.$disconnect());
