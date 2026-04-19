const cron = require('node-cron');
const prisma = require('./prisma');

// Rappel de 11h pour les retards
cron.schedule('0 11 * * *', async () => {
  console.log('Exécution du rappel automatique de 11h00...');
  const delayedRentals = await prisma.rental.findMany({
    where: {
      status: 'ONGOING',
      expectedReturn: { lt: new Date() }
    },
    include: { customer: true, items: { include: { item: true } } }
  });

  if (delayedRentals.length > 0) {
    console.log(`Alertes de retard pour ${delayedRentals.length} locations.`);
  }
});

// Chaque jour à minuit, passer les articles en "Attente Réparation" vers "En Réparation"
cron.schedule('0 0 * * *', async () => {
  console.log('Mise à jour automatique des statuts de réparation (Minuit)...');
  try {
    const result = await prisma.item.updateMany({
      where: { status: 'PENDING_REPAIR' },
      data: { status: 'REPAIRING' }
    });
    console.log(`${result.count} articles sont passés en statut REPAIRING.`);
  } catch (error) {
    console.error('Erreur lors du cron minuit:', error);
  }
});

module.exports = cron;
