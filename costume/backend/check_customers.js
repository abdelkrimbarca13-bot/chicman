const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const customers = await prisma.customer.findMany({
      include: { rentals: true }
    });
    console.log('--- ETAT DES CLIENTS ---');
    customers.forEach(c => {
      console.log(`ID: ${c.id} | Nom: ${c.firstName} ${c.lastName} | Locations: ${c.rentals.length}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
