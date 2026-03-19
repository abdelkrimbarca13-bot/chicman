const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const today = new Date(todayStr);
    
    console.log('Today date used:', today);
    
    const payments = await prisma.payment.findMany({
        where: { createdAt: { gte: today } }
    });
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    console.log('Total payments found:', total);
    
    const daily = await prisma.dailyCash.findUnique({
        where: { date: today }
    });
    
    if (daily) {
        console.log('Daily record found:', daily);
        const finalBalance = daily.initialCash + total - daily.totalExpenses;
        await prisma.dailyCash.update({
            where: { date: today },
            data: { 
                totalRentals: total,
                finalBalance: finalBalance
            }
        });
        console.log('Fixed! Total revenue is now:', total);
    } else {
        console.log('No daily record found for today');
        // Find latest record to see dates
        const last = await prisma.dailyCash.findMany({ orderBy: { date: 'desc' }, take: 5 });
        console.log('Last 5 records:', last);
    }
}

fix().catch(console.error).finally(() => prisma.$disconnect());