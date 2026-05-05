const prisma = require('../utils/prisma');
const XLSX = require('xlsx');
const { logAction } = require('../utils/audit');

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

    // Récupérer les détails des revenus (paiements), ventes et dépenses pour aujourd'hui
    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
      include: { rental: { include: { customer: true } } }
    });

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    const expenses = await prisma.expense.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      orderBy: { date: 'desc' }
    });

    const initialCashLogs = await prisma.auditLog.findMany({
      where: {
        action: 'SET_INITIAL_CASH',
        createdAt: { gte: dayStart, lte: dayEnd }
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    const response = {
      ...dailyCash,
      details: {
        payments,
        sales,
        expenses,
        initialCashLogs
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
    res.status(500).json({ message: error.message, error: error.message });
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

    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    const expenses = await prisma.expense.findMany({
      where: { date: { gte: dayStart, lte: dayEnd } },
      orderBy: { date: 'desc' }
    });

    const initialCashLogs = await prisma.auditLog.findMany({
      where: {
        action: 'SET_INITIAL_CASH',
        createdAt: { gte: dayStart, lte: dayEnd }
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      date: dayStart,
      initialCash: dailyCash?.initialCash || 0,
      totalRentals: dailyCash?.totalRentals || 0,
      totalExpenses: dailyCash?.totalExpenses || 0,
      totalWithdrawals: dailyCash?.totalWithdrawals || 0,
      finalBalance: dailyCash?.finalBalance || 0,
      status: dailyCash?.status || 'OPEN',
      payments,
      sales,
      expenses,
      initialCashLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
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

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat)) {
      return res.status(400).json({ message: 'Montant initial invalide' });
    }

    const dailyCash = await prisma.dailyCash.upsert({
      where: { date: todayDate },
      update: { 
        initialCash: amountFloat
      },
      create: {
        date: todayDate,
        initialCash: amountFloat,
        finalBalance: amountFloat,
        status: 'OPEN'
      }
    });

    await updateDailyStats(todayDate);
    
    await logAction(req.userData.userId, 'SET_INITIAL_CASH', { amount: amountFloat });
    
    const updated = await prisma.dailyCash.findUnique({ where: { date: todayDate } });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

async function updateDailyStats(dateInput) {
  // Ensure we have a valid Date object and normalize to start of day in UTC
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    console.error('Invalid date passed to updateDailyStats:', dateInput);
    return;
  }
  
  const todayStr = d.toISOString().split('T')[0] + 'T00:00:00.000Z';
  const dayStart = new Date(todayStr);
  const dayEnd = new Date(todayStr);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: dayStart, lte: dayEnd }
    }
  });

  const sales = await prisma.sale.findMany({
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

  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalRentals = payments.reduce((sum, p) => sum + p.amount, 0) + totalSales;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  const dailyCash = await prisma.dailyCash.findUnique({
    where: { date: dayStart }
  });

  const initialCash = dailyCash ? dailyCash.initialCash : 0;
  const finalBalance = initialCash + totalRentals - totalExpenses - totalWithdrawals;

  const updatedDailyCash = await prisma.dailyCash.upsert({
    where: { date: dayStart },
    update: {
      totalRentals,
      totalExpenses,
      totalWithdrawals,
      finalBalance
    },
    create: {
      date: dayStart,
      initialCash,
      totalRentals,
      totalExpenses,
      totalWithdrawals,
      finalBalance,
      status: 'OPEN'
    }
  });

  // Propagation removed: each day is now independent
  return updatedDailyCash;
}

exports.createExpense = async (req, res) => {
  try {
    const { amount, description, slipNumber } = req.body;
    
    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        slipNumber: slipNumber || null,
        performedBy: req.userData.username || 'Inconnu',
        date: new Date()
      }
    });

    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const todayDate = new Date(today);
    await updateDailyStats(todayDate);

    await logAction(req.userData.userId, 'CREATE_EXPENSE', { expenseId: expense.id, amount: expense.amount, description: expense.description });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.createWithdrawal = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Seul l\'administrateur peut effectuer des retraits.' });
    }
    const { amount, description } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        amount: parseFloat(amount),
        description,
        performedBy: req.userData.username || 'Inconnu',
        date: new Date()
      }
    });

    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    const todayDate = new Date(today);
    await updateDailyStats(todayDate);

    await logAction(req.userData.userId, 'CREATE_WITHDRAWAL', { withdrawalId: withdrawal.id, amount: withdrawal.amount, description: withdrawal.description });

    res.status(201).json(withdrawal);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.getWithdrawals = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { startDate, endDate, date } = req.query;
    let where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999))
      };
    } else if (date) {
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
    res.status(500).json({ message: error.message, error: error.message });
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
    const allSales = await prisma.sale.aggregate({ _sum: { totalAmount: true } });
    const allExpenses = await prisma.expense.aggregate({ _sum: { amount: true } });
    const allWithdrawals = await prisma.withdrawal.aggregate({ _sum: { amount: true } });
    
    // Le cash total est la somme des revenus moins les dépenses et les retraits effectués (Exclut la monnaie initiale ajoutée)
    const globalCash = (allRentals._sum.amount || 0) + 
                       (allSales._sum.totalAmount || 0) -
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
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999))
      };
    } else if (req.query.date) {
      const dayStart = new Date(new Date(req.query.date).toISOString().split('T')[0] + 'T00:00:00.000Z');
      const dayEnd = new Date(new Date(req.query.date).toISOString().split('T')[0] + 'T23:59:59.999Z');
      where.date = { gte: dayStart, lte: dayEnd };
    }
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
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
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { startDate, endDate } = req.query;
    let where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999))
      };
    }
    const history = await prisma.dailyCash.findMany({
      where,
      orderBy: { date: 'asc' } // Get asc to calculate cumulative
    });

    let cumulative = 0;
    // Calculate cumulative balance for all days up to the filtered ones
    // Actually, to be accurate, we need ALL history up to endDate
    const allUntilEnd = await prisma.dailyCash.findMany({
      where: endDate ? { date: { lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999)) } } : {},
      orderBy: { date: 'asc' }
    });

    const historyWithCumulative = allUntilEnd.map(day => {
      cumulative += day.totalRentals - day.totalExpenses - (day.totalWithdrawals || 0);
      return { ...day, cumulativeBalance: cumulative };
    });

    // If there was a filter, we only return the requested range
    const filteredHistory = historyWithCumulative.filter(day => {
      if (!startDate || !endDate) return true;
      const d = new Date(day.date);
      return d >= new Date(startDate) && d <= new Date(new Date(endDate).setUTCHours(23, 59, 59, 999));
    });

    res.json(filteredHistory.reverse()); // Return descending
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
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

    const allWithdrawals = await prisma.withdrawal.findMany({
      orderBy: { date: 'desc' }
    });

    const summaryData = history.map(item => ({
      'Date': new Date(item.date).toLocaleDateString(),
      'Recettes (+)': item.totalRentals,
      'Dépenses (-)': item.totalExpenses,
      'Solde Final': item.finalBalance
    }));

    const withdrawalData = allWithdrawals.map(w => ({
      'Date': new Date(w.date).toLocaleDateString(),
      'Montant Sortie': w.amount,
      'Auteur Sortie': w.performedBy || 'N/S',
      'Motif': w.description || 'N/S'
    }));

    const workbook = XLSX.utils.book_new();
    const sheet1 = XLSX.utils.json_to_sheet(summaryData);
    const sheet2 = XLSX.utils.json_to_sheet(withdrawalData);
    
    XLSX.utils.book_append_sheet(workbook, sheet1, 'Résumé Quotidien');
    XLSX.utils.book_append_sheet(workbook, sheet2, 'Détails Sorties Cash');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=historique_caisse.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.updateDailyStats = updateDailyStats;

exports.searchBySlipNumber = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Requête invalide' });

    // 1. Chercher dans les dépenses (par slipNumber exact)
    const expense = await prisma.expense.findFirst({
      where: { slipNumber: query },
      orderBy: { date: 'desc' }
    });

    if (expense) {
      // Chercher les logs d'audit associés à cette dépense
      const logs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { details: { contains: `"expenseId":${expense.id}` } },
            { details: { contains: `"expenseId":"${expense.id}"` } }
          ]
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ type: 'EXPENSE', data: expense, logs });
    }

      // 2. Chercher dans les locations (par ID)
      const rentalId = parseInt(query.replace(/[^0-9]/g, '')); 
      if (!isNaN(rentalId)) {
        const rental = await prisma.rental.findUnique({
          where: { id: rentalId },
          include: {
            customer: true,
            items: { include: { item: true } },
            payments: { orderBy: { createdAt: 'desc' } }
          }
        });

        if (rental) {
          const logs = await prisma.auditLog.findMany({
            where: {
              OR: [
                { details: { contains: `"rentalId":${rentalId}` } },
                { details: { contains: `"rentalId":"${rentalId}"` } }
              ]
            },
            include: { user: true },
            orderBy: { createdAt: 'desc' }
          });

          return res.json({ type: 'RENTAL', data: rental, logs });
        }
      }

    res.status(404).json({ message: 'Aucun bon trouvé avec ce numéro.' });
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};
exports.updateExpense = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { id } = req.params;
    const { amount, description, slipNumber } = req.body;

    const oldExpense = await prisma.expense.findUnique({ where: { id: parseInt(id) } });
    if (!oldExpense) return res.status(404).json({ message: 'Dépense non trouvée' });

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat)) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id: parseInt(id) },
      data: {
        amount: amountFloat,
        description,
        slipNumber: slipNumber || null
      }
    });

    await updateDailyStats(updatedExpense.date);
    await logAction(req.userData.userId, 'UPDATE_EXPENSE', { id, oldAmount: oldExpense.amount, newAmount: updatedExpense.amount });

    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { id } = req.params;
    const expense = await prisma.expense.findUnique({ where: { id: parseInt(id) } });
    if (!expense) return res.status(404).json({ message: 'Dépense non trouvée' });

    await prisma.expense.delete({ where: { id: parseInt(id) } });
    await updateDailyStats(expense.date);
    await logAction(req.userData.userId, 'DELETE_EXPENSE', { id, amount: expense.amount });

    res.json({ message: 'Dépense supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.updateWithdrawal = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { id } = req.params;
    const { amount, description } = req.body;

    const oldWithdrawal = await prisma.withdrawal.findUnique({ where: { id: parseInt(id) } });
    if (!oldWithdrawal) return res.status(404).json({ message: 'Retrait non trouvé' });

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat)) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: parseInt(id) },
      data: {
        amount: amountFloat,
        description
      }
    });

    await updateDailyStats(updatedWithdrawal.date);
    await logAction(req.userData.userId, 'UPDATE_WITHDRAWAL', { id, oldAmount: oldWithdrawal.amount, newAmount: updatedWithdrawal.amount });

    res.json(updatedWithdrawal);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.deleteWithdrawal = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { id } = req.params;
    const withdrawal = await prisma.withdrawal.findUnique({ where: { id: parseInt(id) } });
    if (!withdrawal) return res.status(404).json({ message: 'Retrait non trouvé' });

    await prisma.withdrawal.delete({ where: { id: parseInt(id) } });
    await updateDailyStats(withdrawal.date);
    await logAction(req.userData.userId, 'DELETE_WITHDRAWAL', { id, amount: withdrawal.amount });

    res.json({ message: 'Retrait supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { id } = req.params;
    const { amount } = req.body;

    const payment = await prisma.payment.findUnique({ where: { id: parseInt(id) } });
    if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat)) {
      return res.status(400).json({ message: 'Montant invalide' });
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      const up = await tx.payment.update({
        where: { id: parseInt(id) },
        data: { amount: amountFloat }
      });

      // Update rental paidAmount
      const rental = await tx.rental.findUnique({
        where: { id: payment.rentalId },
        include: { payments: true }
      });
      const totalPaid = rental.payments.reduce((sum, p) => sum + p.amount, 0);
      await tx.rental.update({
        where: { id: payment.rentalId },
        data: { paidAmount: totalPaid }
      });

      return up;
    });

    await updateDailyStats(payment.createdAt);
    await logAction(req.userData.userId, 'UPDATE_PAYMENT', { 
      id, 
      rentalId: payment.rentalId,
      oldAmount: payment.amount, 
      newAmount: updatedPayment.amount 
    });

    res.json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const { id } = req.params;
    const payment = await prisma.payment.findUnique({ where: { id: parseInt(id) } });
    if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id: parseInt(id) } });

      // Update rental paidAmount
      const rental = await tx.rental.findUnique({
        where: { id: payment.rentalId },
        include: { payments: true }
      });
      const totalPaid = rental.payments.reduce((sum, p) => sum + p.amount, 0);
      await tx.rental.update({
        where: { id: payment.rentalId },
        data: { paidAmount: totalPaid }
      });
    });

    await updateDailyStats(payment.createdAt);
    await logAction(req.userData.userId, 'DELETE_PAYMENT', { 
      id, 
      rentalId: payment.rentalId,
      amount: payment.amount 
    });

    res.json({ message: 'Paiement supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};
