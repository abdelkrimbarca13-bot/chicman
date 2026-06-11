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
    const perfumeSales = await prisma.perfumeSale.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } }
    });
    const productSales = await prisma.productSale.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } }
    });
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } }
    });
    const withdrawals = await prisma.withdrawal.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } }
    });

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPerfumeSales = perfumeSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProductSales = productSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalRentals = payments.reduce((sum, p) => sum + p.amount, 0) + totalSales + totalPerfumeSales + totalProductSales;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Pour éviter tout report de solde, on vérifie s'il y a eu une action manuelle "SET_INITIAL_CASH" aujourd'hui
    const manualLog = await prisma.auditLog.findFirst({
      where: {
        action: 'SET_INITIAL_CASH',
        createdAt: { gte: dayStart, lte: dayEnd }
      }
    });

    let initialCash = 0;
    if (manualLog) {
      try {
        const details = JSON.parse(manualLog.details);
        initialCash = parseFloat(details.amount) || 0;
      } catch (e) {
        initialCash = day.initialCash || 0;
      }
    }
    
    // Calculate new final balance
    // Caisse aujourd'hui = Monnaie initiale + Recettes - Dépenses - Retraits
    const newFinalBalance = initialCash + totalRentals - totalExpenses - totalWithdrawals;

    console.log(`Date: ${day.date.toISOString().split('T')[0]} | Initial: ${initialCash} | +Rec: ${totalRentals} | -Exp: ${totalExpenses + totalWithdrawals} | New Caisse: ${newFinalBalance}`);

    await prisma.dailyCash.update({
      where: { id: day.id },
      data: {
        initialCash: initialCash,
        totalRentals: totalRentals,
        totalExpenses: totalExpenses,
        totalWithdrawals: totalWithdrawals,
        finalBalance: newFinalBalance
      }
    });
  }

  console.log('Starting item status correction...');
  // Get all items that are currently marked as RENTED
  const rentedItems = await prisma.item.findMany({
    where: { status: 'RENTED' },
    include: {
      rentals: {
        where: {
          rental: {
            status: { in: ['LIVRÉE', 'EN_RÉPARATION', 'DELAYED', 'ONGOING'] }
          }
        }
      }
    }
  });

  console.log(`Checking ${rentedItems.length} items currently marked as RENTED...`);
  
  let fixedCount = 0;
  for (const item of rentedItems) {
    if (item.rentals.length === 0) {
      console.log(`Fixing item ${item.reference} (${item.name}): RENTED -> AVAILABLE`);
      await prisma.item.update({
        where: { id: item.id },
        data: { status: 'AVAILABLE' }
      });
      fixedCount++;
    }
  }
  console.log(`Fixed status for ${fixedCount} items.`);

  console.log('Balance fix completed.');
}

fixBalances()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
