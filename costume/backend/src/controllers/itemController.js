const prisma = require('../utils/prisma');

exports.getAllItems = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let where = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Trouve les articles qui ont une location qui chevauche les dates demandées
      const busyItems = await prisma.rentalItem.findMany({
        where: {
          rental: {
            status: { in: ['ONGOING', 'DELAYED'] },
            OR: [
              {
                AND: [
                  { startDate: { lte: end } },
                  { expectedReturn: { gte: start } }
                ]
              }
            ]
          }
        },
        select: { itemId: true }
      });

      const busyItemIds = busyItems.map(bi => bi.itemId);
      where = {
        id: { notIn: busyItemIds },
        status: 'AVAILABLE' // Doit aussi être physiquement disponible
      };
    }

    const items = await prisma.item.findMany({ where });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const item = await prisma.item.create({ data: req.body });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.item.update({
      where: { id: parseInt(id) },
      data: req.body
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['AVAILABLE', 'RENTED', 'CLEANING', 'REPAIRING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const item = await prisma.item.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getItemDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await prisma.item.findUnique({
      where: { id: parseInt(id) },
      include: {
        rentals: {
          include: {
            rental: {
              include: { customer: true }
            }
          }
        }
      }
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getItemByReference = async (req, res) => {
  try {
    const { ref } = req.params;
    const item = await prisma.item.findUnique({
      where: { reference: ref }
    });
    if (!item) return res.status(404).json({ message: 'Article non trouvé' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id);

    // Vérifier si l'article est actuellement loué
    const activeRental = await prisma.rentalItem.findFirst({
      where: {
        itemId: itemId,
        rental: {
          status: { in: ['ONGOING', 'DELAYED'] }
        }
      }
    });

    if (activeRental) {
      return res.status(400).json({ 
        error: "Impossible de supprimer cet article car il est actuellement associé à une location en cours ou en retard." 
      });
    }

    // Supprimer l'historique de location de cet article d'abord (contrainte clé étrangère)
    await prisma.rentalItem.deleteMany({
      where: { itemId: itemId }
    });

    // Supprimer l'article
    await prisma.item.delete({
      where: { id: itemId }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
