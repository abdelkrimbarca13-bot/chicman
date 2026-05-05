const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBalances() {
  console.log('Starting balance fix (Daily Independent Logic)...');
  
  // Get all daily cash records ordered by date
  const allDays = await prisma.dailyCash.findMany({
    orderBy: { date: 'asc' }
  });

  console.log(`Found ${allDays.length} days to process.`);

  for (const day of allDays) {
    const dayStart = new Date(day.date);
    const dayEnd = new Date(day.date);
    dayEnd.setUTCHours(23, 59, 59, 999);

    // Recalculate totals for this day
    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } }
    });
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } }
    });
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } }
    });
    const withdrawals = await prisma.withdrawal.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } }
    });

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalRentals = payments.reduce((sum, p) => sum + p.amount, 0) + totalSales;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Initial cash is now independent (it's what was manually added for that day)
    // We keep day.initialCash as it is the manual input.
    const initialCash = day.initialCash;
    
    // Calculate new final balance
    // Caisse aujourd'hui = Monnaie initiale + Recettes - Dépenses - Retraits
    const newFinalBalance = initialCash + totalRentals - totalExpenses - totalWithdrawals;

    console.log(`Date: ${day.date.toISOString().split('T')[0]} | Initial: ${initialCash} | +Rec: ${totalRentals} | -Exp: ${totalExpenses + totalWithdrawals} | New Caisse: ${newFinalBalance}`);

    await prisma.dailyCash.update({
      where: { id: day.id },
      data: {
        totalRentals: totalRentals,
        totalExpenses: totalExpenses,
        totalWithdrawals: totalWithdrawals,
        finalBalance: newFinalBalance
      }
    });
  }

  console.log('Balance fix completed.');
}

fixBalances()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
