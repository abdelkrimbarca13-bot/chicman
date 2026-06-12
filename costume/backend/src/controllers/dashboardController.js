const prisma = require('../utils/prisma');

exports.getStats = async (req, res) => {
  try {
    const activeRentals = await prisma.rental.count({ where: { status: 'LIVRÉE' } });
    const availableItems = await prisma.item.count({ where: { status: 'AVAILABLE' } });
    const rentedItems = await prisma.item.count({ where: { status: 'RENTED' } });
    const totalRentalsCount = await prisma.rental.count();
    const repairingItems = await prisma.item.count({ where: { status: 'REPAIRING' } });
    const cleaningItems = await prisma.item.count({ where: { status: 'CLEANING' } });

    // Today's revenue - Seul l'admin voit ça
    let dailyRevenue = 0;
    if (req.userData.role === 'ADMIN') {
      const todayStr = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
      const todayDate = new Date(todayStr);
      const dailyCash = await prisma.dailyCash.findUnique({
        where: { date: todayDate }
      });
      dailyRevenue = dailyCash ? dailyCash.totalRentals : 0;
    }
    
    const delayedRentals = await prisma.rental.findMany({
      where: {
        status: 'LIVRÉE',
        expectedReturn: { lt: new Date() }
      },
      include: { 
        customer: true,
        items: { include: { item: true } }
      }
    });

    // Repairs for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const tomorrowRepairs = await prisma.rentalItem.findMany({
      where: {
        rental: {
          startDate: {
            gte: tomorrow,
            lt: dayAfterTomorrow
          }
        },
        OR: [
          { remarks: { not: null, not: "" } },
          { tailorModification: { not: null, not: "" } }
        ]
      },
      include: {
        item: true,
        rental: {
          include: { customer: true }
        }
      }
    });

    // Cleaning items
    const cleaningItemsList = await prisma.item.findMany({
      where: { status: 'CLEANING' }
    });

    // Rented items
    const rentedItemsList = await prisma.item.findMany({
      where: { status: 'RENTED' }
    });

    // Récupérer les articles marqués manuellement en réparation (PENDING_REPAIR ou REPAIRING)
    const manualRepairs = await prisma.item.findMany({
      where: {
        status: { in: ['REPAIRING', 'PENDING_REPAIR'] }
      }
    });

    // Formater les réparations manuelles pour correspondre au format attendu par le dashboard
    const formattedManualRepairs = manualRepairs.map(item => ({
      id: `manual-${item.id}`,
      item: item,
      tailorModification: 'Réparation / Maintenance',
      remarks: item.statusRemarks || '',
      rental: {
        customer: { firstName: 'STOCK', lastName: 'INTERNE', phone: '-' }
      }
    }));

    const activePerfumesForAlerts = await prisma.perfume.findMany({
      where: { isActive: true, currentQuantityMl: { gt: 0 } }
    });
    const perfumeAlertsCount = activePerfumesForAlerts.filter(p => p.currentQuantityMl <= p.alertThresholdMl).length;

    res.json({
      activeRentals,
      availableItems,
      rentedItems,
      totalRentalsCount,
      repairingItems: repairingItems + manualRepairs.length,
      cleaningItems,
      dailyRevenue: req.userData.role === 'ADMIN' ? dailyRevenue : null,
      delayedRentals,
      tomorrowRepairs: [...tomorrowRepairs, ...formattedManualRepairs],
      cleaningItemsList,
      rentedItemsList,
      perfumeAlertsCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
