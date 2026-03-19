const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    // Rental 9: total 6000, discount 300 -> net 5700? 
    // Wait, let's look at totalAmount in rental record.
    // Rental 9 totalAmount: 6000.
    // Payments: 2000, 4000, 4000.
    // We keep 2000 and 4000.
    
    // Delete one 4000 payment for rental 9
    const p9 = await prisma.payment.findFirst({ where: { rentalId: 9, amount: 4000 } });
    if (p9) {
        await prisma.payment.delete({ where: { id: p9.id } });
        console.log('Deleted one 4000 payment for rental 9');
    }

    // Rental 10 totalAmount: 7200.
    // Payments: 3200, 4000, 4000.
    // We keep 3200 and 4000.
    
    // Delete one 4000 payment for rental 10
    const p10 = await prisma.payment.findFirst({ where: { rentalId: 10, amount: 4000 } });
    if (p10) {
        await prisma.payment.delete({ where: { id: p10.id } });
        console.log('Deleted one 4000 payment for rental 10');
    }

    // Update paidAmount in rentals
    await prisma.rental.update({ where: { id: 9 }, data: { paidAmount: 6000 } });
    await prisma.rental.update({ where: { id: 10 }, data: { paidAmount: 7200 } });

    // Recalculate daily stats
    const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const today = new Date(todayStr);
    const payments = await prisma.payment.findMany({ where: { createdAt: { gte: today } } });
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    
    const daily = await prisma.dailyCash.findUnique({ where: { date: today } });
    if (daily) {
        const finalBalance = daily.initialCash + total - daily.totalExpenses;
        await prisma.dailyCash.update({
            where: { date: today },
            data: { totalRentals: total, finalBalance: finalBalance }
        });
        console.log('Cleanup done! New total revenue:', total);
    }
}

clean().catch(console.error).finally(() => prisma.$disconnect());