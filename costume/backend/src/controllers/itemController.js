const prisma = require('../utils/prisma');
const { logAction } = require('../utils/audit');

exports.getAllItems = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let where = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // 1. Trouver tous les articles directement occupés par une location qui chevauche exactement ces heures
      const overlappingRentalItems = await prisma.rentalItem.findMany({
        where: {
          rental: {
            status: { in: ['ONGOING', 'DELAYED'] },
            AND: [
              { startDate: { lt: end } },
              { expectedReturn: { gt: start } }
            ]
          }
        },
        include: { item: true }
      });

      const busyItemIds = new Set(overlappingRentalItems.map(ri => ri.itemId));
      const busyEnsembleIds = new Set(overlappingRentalItems.map(ri => ri.item.ensembleId).filter(id => id));

      // 2. Un article est indisponible si :
      // - Il est déjà dans busyItemIds
      // - OU il appartient à un ensemble dont un élément est dans busyEnsembleIds
      // - OU il est physiquement en nettoyage/réparation (si la date de début est aujourd'hui)
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isStartingToday = start <= today;

      const allItems = await prisma.item.findMany();
      const availableItems = allItems.filter(item => {
        // Bloqué par location directe
        if (busyItemIds.has(item.id)) return false;
        
        // Bloqué car son ensemble est occupé
        if (item.ensembleId && busyEnsembleIds.has(item.ensembleId)) return false;
        
        // Bloqué physiquement si location immédiate
        // PENDING_REPAIR est disponible aujourd'hui (isStartingToday === true)
        if (isStartingToday && ['CLEANING', 'REPAIRING', 'RENTED', 'TAILOR'].includes(item.status)) return false;

        // Si la location ne commence PAS aujourd'hui, PENDING_REPAIR n'est plus disponible
        if (!isStartingToday && ['CLEANING', 'REPAIRING', 'RENTED', 'TAILOR', 'PENDING_REPAIR'].includes(item.status)) return false;

        return true;
      });

      return res.json(availableItems);
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
    await logAction(req.userData.userId, 'CREATE_ITEM', { itemId: item.id, reference: item.reference });
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
    await logAction(req.userData.userId, 'UPDATE_ITEM', { itemId: id, reference: item.reference });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['AVAILABLE', 'RENTED', 'CLEANING', 'REPAIRING', 'TAILOR', 'PENDING_REPAIR'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const item = await prisma.item.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    await logAction(req.userData.userId, 'UPDATE_ITEM_STATUS', { itemId: id, reference: item.reference, status });
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

exports.bulkCreateItems = async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Format invalide' });

    let createdCount = 0;
    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const itemData of items) {
        const existingItem = await tx.item.findUnique({
          where: { reference: itemData.reference }
        });

        if (existingItem) {
          // Si l'article existe, on ne met à jour QUE si le prix a changé
          if (existingItem.rentalPrice !== itemData.rentalPrice) {
            await tx.item.update({
              where: { id: existingItem.id },
              data: { rentalPrice: itemData.rentalPrice }
            });
            updatedCount++;
          }
        } else {
          // Si l'article n'existe pas, on le crée
          await tx.item.create({ data: itemData });
          createdCount++;
        }
      }
    });

    await logAction(req.userData.userId, 'BULK_IMPORT_ITEMS', { created: createdCount, updated: updatedCount });
    res.status(201).json({ 
      message: `Importation terminée : ${createdCount} nouveaux articles créés, ${updatedCount} prix mis à jour.` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id);

    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Seul l\'administrateur peut supprimer un article.' });
    }

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

    await logAction(req.userData.userId, 'DELETE_ITEM', { itemId });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
