const prisma = require('../utils/prisma');

exports.getStats = async (req, res) => {
  try {
    const activeRentals = await prisma.rental.count({ where: { status: 'ONGOING' } });
    const availableItems = await prisma.item.count({ where: { status: 'AVAILABLE' } });
    const rentedItems = await prisma.item.count({ where: { status: 'RENTED' } });

    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dailyPayments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: today }
      }
    });
    const dailyRevenue = dailyPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Delays
    const delayedRentals = await prisma.rental.findMany({
      where: {
        status: 'ONGOING',
        expectedReturn: { lt: new Date() }
      },
      include: { customer: true }
    });

    res.json({
      activeRentals,
      availableItems,
      rentedItems,
      dailyRevenue,
      delayedRentals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
