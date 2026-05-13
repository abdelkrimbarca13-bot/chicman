const prisma = require('../utils/prisma');
const { updateDailyStats } = require('./cashController');
const { logAction } = require('../utils/audit');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { reference, name, type, size, color, purchasePrice, salePrice, quantity } = req.body;

    const product = await prisma.product.create({
      data: {
        reference,
        name,
        type,
        size,
        color,
        purchasePrice: parseFloat(purchasePrice),
        salePrice: parseFloat(salePrice),
        quantity: parseInt(quantity) || 0
      }
    });

    await logAction(req.userData.userId, 'CREATE_PRODUCT', { productId: product.id, reference });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reference, name, type, size, color, purchasePrice, salePrice, quantity } = req.body;

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        reference,
        name,
        type,
        size,
        color,
        purchasePrice: parseFloat(purchasePrice),
        salePrice: parseFloat(salePrice),
        quantity: parseInt(quantity)
      }
    });

    await logAction(req.userData.userId, 'UPDATE_PRODUCT', { productId: id });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if has sales
    const salesCount = await prisma.productSale.count({ where: { productId: parseInt(id) } });
    
    if (salesCount > 0) {
      // Archive instead of delete
      await prisma.product.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });
      await logAction(req.userData.userId, 'ARCHIVE_PRODUCT', { productId: id });
      return res.status(200).json({ message: 'Le produit a été archivé car il contient des données de vente.' });
    }

    await prisma.product.delete({ where: { id: parseInt(id) } });
    await logAction(req.userData.userId, 'DELETE_PRODUCT', { productId: id });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProductSale = async (req, res) => {
  try {
    const { productId, quantity, customerName, customerPhone, discount } = req.body;
    const qty = parseInt(quantity);
    const disc = parseFloat(discount) || 0;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) return res.status(404).json({ message: 'Produit non trouvé' });
    if (product.quantity < qty) {
      return res.status(400).json({ message: `Stock insuffisant. Disponible: ${product.quantity}` });
    }

    const grossAmount = qty * product.salePrice;
    const totalAmount = grossAmount - disc;
    const totalCost = qty * product.purchasePrice;
    const profit = totalAmount - totalCost;

    const sale = await prisma.$transaction(async (tx) => {
      // 1. Create sale record
      const newSale = await tx.productSale.create({
        data: {
          productId: parseInt(productId),
          quantity: qty,
          unitPrice: product.salePrice,
          totalAmount,
          totalCost,
          profit,
          discount: disc,
          customerName,
          customerPhone,
          performedBy: req.userData.username
        },
        include: { product: true }
      });

      // 2. Update stock
      await tx.product.update({
        where: { id: parseInt(productId) },
        data: { quantity: { decrement: qty } }
      });

      return newSale;
    });

    // Update daily stats
    await updateDailyStats(new Date());

    await logAction(req.userData.userId, 'PRODUCT_SALE', { 
      saleId: sale.id, 
      product: `${product.reference} ${product.name}`,
      qty,
      totalAmount,
      discount: disc
    });

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductSales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let where = {};
    if (startDate && endDate) {
      where.date = {
        gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999))
      };
    }

    const sales = await prisma.productSale.findMany({
      where,
      include: { product: true },
      orderBy: { date: 'desc' },
      take: startDate && endDate ? undefined : 100
    });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const totalSales = await prisma.productSale.aggregate({
      _sum: { totalAmount: true, profit: true, quantity: true }
    });

    const lowStockCount = await prisma.product.count({
      where: { quantity: { lte: 5, gt: 0 } }
    });

    const outOfStockCount = await prisma.product.count({
      where: { quantity: 0 }
    });

    res.json({
      totalRevenue: totalSales._sum.totalAmount || 0,
      totalProfit: totalSales._sum.profit || 0,
      totalSold: totalSales._sum.quantity || 0,
      lowStockCount,
      outOfStockCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProductSale = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const { id } = req.params;
    const { totalAmount, discount } = req.body;

    const sale = await prisma.productSale.findUnique({
      where: { id: parseInt(id) }
    });
    if (!sale) return res.status(404).json({ message: 'Vente non trouvée' });

    const newAmount = parseFloat(totalAmount);
    const newDiscount = parseFloat(discount) || sale.discount;
    // Recalculate profit based on the new total amount
    const newProfit = newAmount - sale.totalCost;

    const updatedSale = await prisma.productSale.update({
      where: { id: parseInt(id) },
      data: {
        totalAmount: newAmount,
        discount: newDiscount,
        profit: newProfit
      }
    });

    await updateDailyStats(sale.date);
    await logAction(req.userData.userId, 'UPDATE_PRODUCT_SALE', { id, oldAmount: sale.totalAmount, newAmount: updatedSale.totalAmount });

    res.json(updatedSale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProductSale = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    const { id } = req.params;

    const sale = await prisma.productSale.findUnique({
      where: { id: parseInt(id) }
    });
    if (!sale) return res.status(404).json({ message: 'Vente non trouvée' });

    await prisma.$transaction([
      prisma.productSale.delete({ where: { id: parseInt(id) } }),
      prisma.product.update({
        where: { id: sale.productId },
        data: { quantity: { increment: sale.quantity } }
      })
    ]);

    await updateDailyStats(sale.date);
    await logAction(req.userData.userId, 'DELETE_PRODUCT_SALE', { id, productId: sale.productId, quantity: sale.quantity });

    res.json({ message: 'Vente supprimée et stock restauré' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
