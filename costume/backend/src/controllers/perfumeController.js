const prisma = require('../utils/prisma');
const { updateDailyStats } = require('./cashController');
const { logAction } = require('../utils/audit');

exports.getAllPerfumes = async (req, res) => {
  try {
    const perfumes = await prisma.perfume.findMany({
      where: { isActive: true },
      orderBy: { brand: 'asc' }
    });
    res.json(perfumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPerfume = async (req, res) => {
  try {
    const { brand, name, totalCapacityMl, totalPurchasePrice, salePriceMl, alertThresholdMl } = req.body;

    const unitCostMl = parseFloat(totalPurchasePrice) / parseFloat(totalCapacityMl);

    const perfume = await prisma.perfume.create({
      data: {
        brand,
        name,
        totalCapacityMl: parseFloat(totalCapacityMl),
        initialQuantityMl: parseFloat(totalCapacityMl),
        currentQuantityMl: parseFloat(totalCapacityMl),
        totalPurchasePrice: parseFloat(totalPurchasePrice),
        unitCostMl,
        salePriceMl: parseFloat(salePriceMl),
        alertThresholdMl: parseFloat(alertThresholdMl) || 30
      }
    });

    await logAction(req.userData.userId, 'CREATE_PERFUME', { perfumeId: perfume.id, name: `${brand} ${name}` });
    res.status(201).json(perfume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePerfume = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand, name, totalCapacityMl, totalPurchasePrice, salePriceMl, alertThresholdMl, currentQuantityMl } = req.body;

    const unitCostMl = parseFloat(totalPurchasePrice) / parseFloat(totalCapacityMl);

    const perfume = await prisma.perfume.update({
      where: { id: parseInt(id) },
      data: {
        brand,
        name,
        totalCapacityMl: parseFloat(totalCapacityMl),
        totalPurchasePrice: parseFloat(totalPurchasePrice),
        unitCostMl,
        salePriceMl: parseFloat(salePriceMl),
        alertThresholdMl: parseFloat(alertThresholdMl) || 30,
        currentQuantityMl: currentQuantityMl !== undefined ? parseFloat(currentQuantityMl) : undefined
      }
    });

    await logAction(req.userData.userId, 'UPDATE_PERFUME', { perfumeId: id });
    res.json(perfume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePerfume = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if has sales
    const salesCount = await prisma.perfumeSale.count({ where: { perfumeId: parseInt(id) } });
    
    if (salesCount > 0) {
      // Archive instead of delete
      await prisma.perfume.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });
      await logAction(req.userData.userId, 'ARCHIVE_PERFUME', { perfumeId: id });
      return res.status(200).json({ message: 'Le parfum a été archivé car il contient des données de vente.' });
    }

    await prisma.perfume.delete({ where: { id: parseInt(id) } });
    await logAction(req.userData.userId, 'DELETE_PERFUME', { perfumeId: id });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPerfumeSale = async (req, res) => {
  try {
    const { perfumeId, quantityMl } = req.body;
    const qty = parseFloat(quantityMl);

    const perfume = await prisma.perfume.findUnique({
      where: { id: parseInt(perfumeId) }
    });

    if (!perfume) return res.status(404).json({ message: 'Parfum non trouvé' });
    if (perfume.currentQuantityMl < qty) {
      return res.status(400).json({ message: `Stock insuffisant. Disponible: ${perfume.currentQuantityMl} ml` });
    }

    const totalAmount = qty * perfume.salePriceMl;
    const totalCost = qty * perfume.unitCostMl;
    const profit = totalAmount - totalCost;

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create sale record
      const newSale = await tx.perfumeSale.create({
        data: {
          perfumeId: parseInt(perfumeId),
          quantityMl: qty,
          unitPriceMl: perfume.salePriceMl,
          totalAmount,
          totalCost,
          profit,
          performedBy: req.userData.username
        }
      });

      // 2. Update stock
      await tx.perfume.update({
        where: { id: parseInt(perfumeId) },
        data: { currentQuantityMl: { decrement: qty } }
      });

      return newSale;
    });

    // Update daily stats
    await updateDailyStats(new Date());

    await logAction(req.userData.userId, 'PERFUME_SALE', { 
      saleId: sale.id, 
      perfume: `${perfume.brand} ${perfume.name}`,
      qty,
      totalAmount
    });

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPerfumeSales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999))
      };
    }

    const sales = await prisma.perfumeSale.findMany({
      where,
      include: { perfume: true },
      orderBy: { date: 'desc' },
      take: startDate && endDate ? undefined : 100 // Limit to 100 if no date range
    });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPerfumeStats = async (req, res) => {
  try {
    const totalSales = await prisma.perfumeSale.aggregate({
      _sum: { totalAmount: true, profit: true, quantityMl: true }
    });

    const lowStockCount = await prisma.perfume.count({
      where: { currentQuantityMl: { lte: 30, gt: 0 } }
    });

    const outOfStockCount = await prisma.perfume.count({
      where: { currentQuantityMl: 0 }
    });

    res.json({
      totalRevenue: totalSales._sum.totalAmount || 0,
      totalProfit: totalSales._sum.profit || 0,
      totalMlSold: totalSales._sum.quantityMl || 0,
      lowStockCount,
      outOfStockCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
