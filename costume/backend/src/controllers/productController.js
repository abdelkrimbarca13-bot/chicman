const prisma = require('../utils/prisma');
const XLSX = require('xlsx');
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
    const { items, customerName, customerPhone, discount } = req.body;
    const disc = parseFloat(discount) || 0;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Au moins un produit est requis.' });
    }

    // 1. Récupérer tous les produits concernés
    const productIds = items.map(i => parseInt(i.productId));
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    // 2. Valider l'existence et le stock
    for (const item of items) {
      const product = dbProducts.find(p => p.id === parseInt(item.productId));
      if (!product) return res.status(404).json({ message: `Produit ID ${item.productId} non trouvé` });
      if (product.quantity < parseInt(item.quantity)) {
        return res.status(400).json({ message: `Stock insuffisant pour ${product.name}. Disponible: ${product.quantity}` });
      }
    }

    // 3. Transaction pour créer les ventes et mettre à jour les stocks
    const results = await prisma.$transaction(async (tx) => {
      const sales = [];
      const itemDisc = disc / items.length;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const product = dbProducts.find(p => p.id === parseInt(item.productId));
        const qty = parseInt(item.quantity);
        
        // Répartir la remise sur les articles
        const currentItemDiscount = i === items.length - 1 
          ? disc - (Math.floor(itemDisc) * (items.length - 1)) 
          : Math.floor(itemDisc);

        const grossAmount = qty * product.salePrice;
        const totalAmount = grossAmount - currentItemDiscount;
        const totalCost = qty * product.purchasePrice;
        const profit = totalAmount - totalCost;

        const newSale = await tx.productSale.create({
          data: {
            productId: product.id,
            quantity: qty,
            unitPrice: product.salePrice,
            totalAmount,
            totalCost,
            profit,
            discount: currentItemDiscount,
            customerName,
            customerPhone,
            performedBy: req.userData.username
          },
          include: { product: true }
        });

        await tx.product.update({
          where: { id: product.id },
          data: { quantity: { decrement: qty } }
        });

        sales.push(newSale);
      }
      return sales;
    });

    // Mettre à jour les stats journalières
    await updateDailyStats(new Date());

    await logAction(req.userData.userId, 'PRODUCT_SALE_MULTI', { 
      count: items.length, 
      customerName,
      totalItems: items.length
    });

    res.status(201).json(results);
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

exports.downloadTemplate = async (req, res) => {
  try {
    const templateData = [
      {
        'Référence': 'CH-001',
        'Nom': 'Chemise Slim Fit',
        'Type': 'Chemise',
        'Taille': 'XL',
        'Couleur': 'Blanc',
        'Prix Achat (DA)': 1500,
        'Prix Vente (DA)': 2500,
        'Quantité': 10
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template Boutique');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=template_boutique.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.importProducts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = { success: 0, errors: 0 };

    for (const row of data) {
      try {
        const reference = row['Référence'];
        const name = row['Nom'];
        const type = row['Type'];
        const size = row['Taille'];
        const color = row['Couleur'];
        const purchasePrice = parseFloat(row['Prix Achat (DA)']);
        const salePrice = parseFloat(row['Prix Vente (DA)']);
        const quantity = parseInt(row['Quantité']) || 0;

        if (!reference || !name || isNaN(purchasePrice) || isNaN(salePrice)) {
          results.errors++;
          continue;
        }

        await prisma.product.upsert({
          where: { reference },
          update: {
            name, type, size, color,
            purchasePrice, salePrice,
            quantity: { increment: quantity }
          },
          create: {
            reference, name, type, size, color,
            purchasePrice, salePrice, quantity
          }
        });
        results.success++;
      } catch (err) {
        results.errors++;
      }
    }

    await logAction(req.userData.userId, 'IMPORT_PRODUCTS', { success: results.success, errors: results.errors });
    res.json({ message: 'Importation terminée', ...results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
