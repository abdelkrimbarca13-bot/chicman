const prisma = require('../utils/prisma');

exports.getDailyCash = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const dayStart = new Date(today);
    const dayEnd = new Date(today);
    dayEnd.setUTCHours(23, 59, 59, 999);

    let dailyCash = await prisma.dailyCash.findUnique({
      where: { date: dayStart }
    });

    if (!dailyCash) {
      dailyCash = await prisma.dailyCash.create({
        data: {
          date: dayStart,
          initialCash: 0,
          totalRentals: 0,
          totalExpenses: 0,
          finalBalance: 0,
          status: 'OPEN'
        }
      });
    }

    // Récupérer les détails des revenus (paiements) et dépenses pour aujourd'hui
    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
      include: { rental: { include: { customer: true } } }
    });

    const expenses = await prisma.expense.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      orderBy: { date: 'desc' }
    });

    const response = {
      ...dailyCash,
      details: {
        payments,
        expenses
      }
    };

    // Filtrer les données si l'utilisateur n'est pas ADMIN
    if (req.userData.role !== 'ADMIN') {
        delete response.initialCash;
        delete response.totalRentals;
        delete response.finalBalance;
        // On ne montre pas les revenus aux employés, seulement leurs dépenses
        delete response.details.payments;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDayDetails = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const { date } = req.params;
    const dayStart = new Date(new Date(date).toISOString().split('T')[0] + 'T00:00:00.000Z');
    const dayEnd = new Date(new Date(date).toISOString().split('T')[0] + 'T23:59:59.999Z');

    const dailyCash = await prisma.dailyCash.findUnique({
      where: { date: dayStart }
    });

    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
      include: { 
        rental: { 
          include: { 
            customer: true,
            items: { include: { item: true } }
          } 
        } 
      }
    });

    const expenses = await prisma.expense.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      orderBy: { date: 'desc' }
    });

    res.json({
      ...dailyCash,
      payments,
      expenses
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.setInitialCash = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Seul l\'administrateur peut modifier le fond de caisse.' });
    }
    const { amount } = req.body;
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const todayDate = new Date(today);

    const dailyCash = await prisma.dailyCash.upsert({
      where: { date: todayDate },
      update: { 
        initialCash: parseFloat(amount)
      },
      create: {
        date: todayDate,
        initialCash: parseFloat(amount),
        finalBalance: parseFloat(amount),
        status: 'OPEN'
      }
    });

    await updateDailyStats(todayDate);
    const updated = await prisma.dailyCash.findUnique({ where: { date: todayDate } });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function updateDailyStats(date) {
  // Use the date as is, but ensure it's the start of the day in UTC
  const todayStr = new Date(date).toISOString().split('T')[0] + 'T00:00:00.000Z';
  const dayStart = new Date(todayStr);
  const dayEnd = new Date(todayStr);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: dayStart, lte: dayEnd }
    }
  });

  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd }
    }
  });

  const totalRentals = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const dailyCash = await prisma.dailyCash.findUnique({
    where: { date: dayStart }
  });

  const initialCash = dailyCash ? dailyCash.initialCash : 0;
  const finalBalance = initialCash + totalRentals - totalExpenses;

  return await prisma.dailyCash.upsert({
    where: { date: dayStart },
    update: {
      totalRentals,
      totalExpenses,
      finalBalance
    },
    create: {
      date: dayStart,
      initialCash,
      totalRentals,
      totalExpenses,
      finalBalance,
      status: 'OPEN'
    }
  });
}

exports.createExpense = async (req, res) => {
  try {
    const { amount, description, slipNumber } = req.body;
    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        slipNumber: slipNumber || null,
        date: new Date()
      }
    });

    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const todayDate = new Date(today);
    await updateDailyStats(todayDate);

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { date } = req.query;
    let where = {};
    if (date) {
      const dayStart = new Date(new Date(date).toISOString().split('T')[0] + 'T00:00:00.000Z');
      const dayEnd = new Date(new Date(date).toISOString().split('T')[0] + 'T23:59:59.999Z');
      where.date = { gte: dayStart, lte: dayEnd };
    }
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDailyReport = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const todayDate = new Date(today);
    const report = await updateDailyStats(todayDate);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }
    const history = await prisma.dailyCash.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDailyStats = updateDailyStats;
