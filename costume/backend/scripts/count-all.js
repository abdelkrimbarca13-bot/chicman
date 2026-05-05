const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function count() {
  const c = await prisma.rental.count();
  const p = await prisma.payment.count();
  const d = await prisma.dailyCash.count();
  console.log('Rentals:', c);
  console.log('Payments:', p);
  console.log('DailyCash:', d);
}
count().finally(() => prisma.$disconnect());
