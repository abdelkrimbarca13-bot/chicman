const prisma = require('../utils/prisma');

exports.getStats = async (req, res) => {
  try {
    const activeRentals = await prisma.rental.count({ where: { status: 'ONGOING' } });
    const availableItems = await prisma.item.count({ where: { status: 'AVAILABLE' } });
    const rentedItems = await prisma.item.count({ where: { status: 'RENTED' } });
    const repairingItems = await prisma.item.count({ where: { status: 'REPAIRING' } });
    const cleaningItems = await prisma.item.count({ where: { status: 'CLEANING' } });

    // Today's revenue - Seul l'admin voit ça
    let dailyRevenue = 0;
    if (req.userData.role === 'ADMIN') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dailyPayments = await prisma.payment.findMany({
        where: {
          createdAt: { gte: today }
        }
      });
      dailyRevenue = dailyPayments.reduce((sum, p) => sum + p.amount, 0);
    }
    
    // Delays
    const delayedRentals = await prisma.rental.findMany({
      where: {
        status: 'ONGOING',
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

    res.json({
      activeRentals,
      availableItems,
      rentedItems,
      repairingItems: repairingItems + manualRepairs.length,
      cleaningItems,
      dailyRevenue: req.userData.role === 'ADMIN' ? dailyRevenue : null,
      delayedRentals,
      tomorrowRepairs: [...tomorrowRepairs, ...formattedManualRepairs],
      cleaningItemsList,
      rentedItemsList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
