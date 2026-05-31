const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Mettre tous les articles en statut disponible ---');
  const result = await prisma.item.updateMany({
    data: {
      status: 'AVAILABLE',
      statusRemarks: null
    }
  });
  console.log(`${result.count} articles mis à jour avec le statut AVAILABLE.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
