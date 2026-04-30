const prisma = require('../utils/prisma');
const { logAction } = require('../utils/audit');
const { updateDailyStats } = require('./cashController');

exports.createSale = async (req, res) => {
  try {
    const { customerName, customerPhone, items, remarks } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ message: 'Nom et téléphone du client requis.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Au moins un article est requis.' });
    }

    // Vérifier que tous les articles existent et sont disponibles
    const itemIds = items.map(i => i.itemId);
    const dbItems = await prisma.item.findMany({
      where: { id: { in: itemIds } }
    });

    if (dbItems.length !== itemIds.length) {
      return res.status(400).json({ message: 'Certains articles n\'existent pas.' });
    }

    // Vérifier qu'aucun article n'est en location active
    const activeRentals = await prisma.rentalItem.findMany({
      where: {
        itemId: { in: itemIds },
        rental: { status: { in: ['ONGOING', 'DELAYED'] } }
      }
    });

    if (activeRentals.length > 0) {
      return res.status(400).json({ 
        message: 'Certains articles sont actuellement en location et ne peuvent pas être vendus.' 
      });
    }

    const totalAmount = items.reduce((sum, i) => sum + parseFloat(i.price), 0);

    // Transaction : créer la vente + supprimer les articles
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Créer la vente
      const newSale = await tx.sale.create({
        data: {
          customerName,
          customerPhone,
          totalAmount,
          remarks: remarks || null,
          performedBy: req.userData.username || 'Inconnu',
          items: {
            create: items.map(i => {
              const dbItem = dbItems.find(d => d.id === i.itemId);
              return {
                itemRef: dbItem.reference,
                itemName: dbItem.name,
                itemType: dbItem.type,
                itemSize: dbItem.size,
                itemColor: dbItem.color,
                price: parseFloat(i.price)
              };
            })
          }
        },
        include: { items: true }
      });

      // 2. Supprimer l'historique de location des articles vendus
      await tx.rentalItem.deleteMany({
        where: { itemId: { in: itemIds } }
      });

      // 3. Supprimer les articles de l'inventaire
      await tx.item.deleteMany({
        where: { id: { in: itemIds } }
      });

      return newSale;
    });

    // 4. Mettre à jour la recette du jour
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
    await updateDailyStats(new Date(today));

    // 5. Logger l'action
    await logAction(req.userData.userId, 'CREATE_SALE', {
      saleId: sale.id,
      totalAmount,
      customerName,
      itemCount: items.length,
      items: sale.items.map(i => ({ ref: i.itemRef, name: i.itemName, price: i.price }))
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAllSales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let where = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(new Date(startDate).setUTCHours(0, 0, 0, 0)),
        lte: new Date(new Date(endDate).setUTCHours(23, 59, 59, 999))
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    });

    if (!sale) {
      return res.status(404).json({ message: 'Vente non trouvée.' });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
