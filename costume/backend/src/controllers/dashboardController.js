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

    res.json({
      activeRentals,
      availableItems,
      rentedItems,
      repairingItems,
      cleaningItems,
      dailyRevenue: req.userData.role === 'ADMIN' ? dailyRevenue : null,
      delayedRentals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
