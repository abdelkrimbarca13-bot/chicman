const prisma = require('../utils/prisma');
const XLSX = require('xlsx');

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

  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd }
    }
  });

  const totalRentals = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  const dailyCash = await prisma.dailyCash.findUnique({
    where: { date: dayStart }
  });

  const initialCash = dailyCash ? dailyCash.initialCash : 0;
  const finalBalance = initialCash + totalRentals - totalExpenses - totalWithdrawals;

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
        performedBy: req.userData.username,
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

exports.createWithdrawal = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Seul l\'administrateur peut effectuer des retraits.' });
    }
    const { amount } = req.body;
    const withdrawal = await prisma.withdrawal.create({
      data: {
        amount: parseFloat(amount),
        performedBy: req.userData.username,
        date: new Date()
      }
    });

    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const todayDate = new Date(today);
    await updateDailyStats(todayDate);

    res.status(201).json(withdrawal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWithdrawals = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { date } = req.query;
    let where = {};
    if (date) {
      const dayStart = new Date(new Date(date).toISOString().split('T')[0] + 'T00:00:00.000Z');
      const dayEnd = new Date(new Date(date).toISOString().split('T')[0] + 'T23:59:59.999Z');
      where.date = { gte: dayStart, lte: dayEnd };
    }
    const withdrawals = await prisma.withdrawal.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    res.json(withdrawals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getGlobalSummary = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { startDate, endDate } = req.query;
    let where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const dailyStats = await prisma.dailyCash.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    const totalIncome = dailyStats.reduce((sum, s) => sum + s.totalRentals, 0);
    const totalExpenses = dailyStats.reduce((sum, s) => sum + s.totalExpenses, 0);
    
    // Pour la période sélectionnée
    const periodWithdrawals = await prisma.withdrawal.aggregate({
      where: startDate && endDate ? {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } : {},
      _sum: { amount: true }
    });

    const totalWithdrawals = periodWithdrawals._sum.amount || 0;
    const netRevenue = totalIncome - totalExpenses - totalWithdrawals;

    // Calcul du CASH TOTAL (depuis le début)
    const allRentals = await prisma.payment.aggregate({ _sum: { amount: true } });
    const allExpenses = await prisma.expense.aggregate({ _sum: { amount: true } });
    const allWithdrawals = await prisma.withdrawal.aggregate({ _sum: { amount: true } });
    const allInitialCash = await prisma.dailyCash.aggregate({ _sum: { initialCash: true } });

    const globalCash = (allInitialCash._sum.initialCash || 0) + 
                       (allRentals._sum.amount || 0) - 
                       (allExpenses._sum.amount || 0) - 
                       (allWithdrawals._sum.amount || 0);

    res.json({
      totalIncome,
      totalExpenses,
      totalWithdrawals,
      netRevenue,
      globalCash,
      period: { startDate, endDate }
    });
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

exports.exportHistoryExcel = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const history = await prisma.dailyCash.findMany({
      orderBy: { date: 'desc' }
    });

    const data = history.map(item => ({
      'Date': new Date(item.date).toLocaleDateString(),
      'Initial Cash': item.initialCash,
      'Total Rentals': item.totalRentals,
      'Total Expenses': item.totalExpenses,
      'Final Balance': item.finalBalance,
      'Status': item.status
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historique');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=historique_caisse.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDailyStats = updateDailyStats;
