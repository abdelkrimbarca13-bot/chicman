const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const payments = await prisma.payment.findMany({
        where: { createdAt: { gte: today } },
        include: { rental: { include: { customer: true } } }
    });
    console.log('Today payments:', JSON.stringify(payments, null, 2));
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    console.log('Total revenue from database:', total);
}

main().catch(console.error).finally(() => prisma.$disconnect());