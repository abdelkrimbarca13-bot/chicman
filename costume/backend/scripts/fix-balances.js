const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBalances() {
  console.log('Starting balance fix...');
  
  // Get all daily cash records ordered by date
  const allDays = await prisma.dailyCash.findMany({
    orderBy: { date: 'asc' }
  });

  console.log(`Found ${allDays.length} days to process.`);

  let previousFinalBalance = 0;

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

    const totalRentals = payments.reduce((sum, p) => sum + p.amount, 0) + 
                         sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Initial cash is the previous day's final balance
    // UNLESS it's the very first day or was manually set? 
    // Actually, the system allows setting initial cash manually for "today".
    
    let initialCash = previousFinalBalance;
    
    // Calculate new final balance with the "no negative" rule
    const newFinalBalance = Math.max(0, initialCash + totalRentals - totalExpenses);

    console.log(`Date: ${day.date.toISOString().split('T')[0]} | Prev: ${previousFinalBalance} | +Rec: ${totalRentals} | -Exp: ${totalExpenses} | New Final: ${newFinalBalance}`);

    await prisma.dailyCash.update({
      where: { id: day.id },
      data: {
        initialCash: initialCash,
        totalRentals: totalRentals,
        totalExpenses: totalExpenses,
        finalBalance: newFinalBalance
      }
    });

    previousFinalBalance = newFinalBalance;
  }

  console.log('Balance fix completed.');
}

fixBalances()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
