const prisma = require('../utils/prisma');

exports.getDailyCash = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';

    let dailyCash = await prisma.dailyCash.findUnique({
      where: { date: new Date(today) }
    });

    if (!dailyCash) {
      dailyCash = await prisma.dailyCash.create({
        data: {
          date: new Date(today),
          initialCash: 0,
          totalRentals: 0,
          totalExpenses: 0,
          finalBalance: 0,
          status: 'OPEN'
        }
      });
    }

    res.json(dailyCash);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.setInitialCash = async (req, res) => {
  try {
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
    const history = await prisma.dailyCash.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDailyStats = updateDailyStats;
