const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Nettoyage des dates futures ---');
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const futureDays = await prisma.dailyCash.findMany({
    where: {
      date: { gt: today }
    }
  });

  if (futureDays.length === 0) {
    console.log('Aucune date future trouvée dans DailyCash.');
  } else {
    console.log(`${futureDays.length} enregistrements futurs trouvés.`);
    for (const day of futureDays) {
      console.log(`Suppression de la journée : ${day.date.toISOString()}`);
      await prisma.dailyCash.delete({
        where: { id: day.id }
      });
    }
    console.log('Suppression terminée.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
