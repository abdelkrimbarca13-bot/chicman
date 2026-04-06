const prisma = require('../utils/prisma');
const { updateDailyStats } = require('./cashController');
const { logAction } = require('../utils/audit');

exports.createRental = async (req, res) => {
  try {
    const { 
      firstName, lastName, phone, 
      items: selectedItems, // items: [{ id, remarks }]
      startDate, expectedReturn, 
      totalAmount, paidAmount, discount, addedAmount, remarks,
      guaranteeDocument 
    } = req.body;

    const itemIds = selectedItems.map(i => i.id);

    // Find or create customer by phone
    let customer = await prisma.customer.findFirst({
      where: { phone: phone }
    });

    if (customer && customer.isBlacklisted) {
      return res.status(403).json({ 
        message: 'Ce client est sur liste noire et ne peut pas effectuer de location.' 
      });
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          firstName,
          lastName,
          phone,
          address: 'Non spécifiée',
          idNumber: 'AUTO-' + Date.now()
        }
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(expectedReturn);
    // Set to 12:00 PM for the return deadline
    end.setHours(12, 0, 0, 0);

    // 1. Récupérer les détails des articles sélectionnés (pour connaître leurs ensembleId)
    const selectedItemsDetails = await prisma.item.findMany({
      where: { id: { in: itemIds } }
    });
    const selectedEnsembleIds = selectedItemsDetails.map(i => i.ensembleId).filter(id => id);

    // 2. Vérifier les chevauchements
    const overlappingRentals = await prisma.rentalItem.findMany({
      where: {
        rental: {
          status: { in: ['ONGOING', 'DELAYED'] },
          AND: [
            { startDate: { lte: end } },
            { expectedReturn: { gte: start } }
          ]
        },
        OR: [
          { itemId: { in: itemIds } },
          { item: { ensembleId: { in: selectedEnsembleIds } } }
        ]
      },
      include: { item: true }
    });

    if (overlappingRentals.length > 0) {
      return res.status(400).json({ 
        message: 'Certains articles (ou éléments de leur ensemble) sont déjà loués pour ces dates', 
        items: [...new Set(overlappingRentals.map(r => r.item.name))]
      });
    }

    // 3. Vérification physique (seulement si la location commence aujourd'hui)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start <= today) {
        const unavailableItems = selectedItemsDetails.filter(item => item.status !== 'AVAILABLE');
        if (unavailableItems.length > 0) {
          return res.status(400).json({ 
            message: 'Certains articles ne sont pas physiquement disponibles aujourd\'hui (en nettoyage ou réparation)', 
            items: unavailableItems.map(i => i.name) 
          });
        }
    }

    // Create rental in transaction
    const rental = await prisma.$transaction(async (tx) => {
      const deposit = parseFloat(paidAmount) || 0;
      const total = parseFloat(totalAmount) || 0;
      const disc = parseFloat(discount) || 0;

      const newRental = await tx.rental.create({
        data: {
          customerId: customer.id,
          startDate: start,
          expectedReturn: end,
          totalAmount: total,
          depositAmount: deposit,
          paidAmount: deposit,
          discount: disc,
          addedAmount: parseFloat(addedAmount) || 0,
          remarks: remarks || null,
          guaranteeDocument: guaranteeDocument || null,
          status: 'ONGOING',
          isActivated: false,
          items: {
            create: selectedItems.map(item => ({ 
              itemId: item.id,
              remarks: item.remarks || null,
              tailorModification: item.tailorModification || null
            }))
          }
        }
      });

      // Update item statuses to RENTED
      await tx.item.updateMany({
        where: { id: { in: itemIds } },
        data: { status: 'RENTED' }
      });

      // Create initial payment if any
      if (deposit > 0) {
        await tx.payment.create({
          data: {
            amount: deposit,
            rentalId: newRental.id
          }
        });

        // Add deposit to cash movement
        await tx.cashMovement.create({
          data: {
            rentalId: newRental.id,
            amount: deposit,
            type: 'DEPOSIT',
            description: `Versement initial - Client: ${firstName} ${lastName}`,
            date: new Date()
          }
        });
      }

      return newRental;
    });

    // Update daily cash stats
    if (parseFloat(paidAmount) > 0) {
      await updateDailyStats(new Date());
    }

    await logAction(req.userData.userId, 'CREATE_RENTAL', { rentalId: rental.id, customer: `${firstName} ${lastName}` });

    res.status(201).json(rental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllRentals = async (req, res) => {
  try {
    const rentals = await prisma.rental.findMany({
      include: {
        customer: true,
        items: { include: { item: true } },
        payments: true,
        cashMovements: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCashMovements = async (req, res) => {
  try {
    const cashMovements = await prisma.cashMovement.findMany({
      include: {
        rental: {
          include: { customer: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    res.json(cashMovements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRevenue = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        rental: {
          include: { customer: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: parseInt(id) },
      include: { payments: true }
    });

    if (!rental) return res.status(404).json({ message: 'Rental not found' });

    const currentPaid = rental.payments.reduce((sum, p) => sum + p.amount, 0);
    const maxAllowed = Math.max(0, rental.totalAmount - currentPaid);
    
    if (parseFloat(amount) > maxAllowed) {
        return res.status(400).json({ message: `Le montant dépasse le reste à payer (${maxAllowed} DA)` });
    }

    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        rentalId: parseInt(id)
      }
    });

    // Update rental paidAmount
    await prisma.rental.update({
      where: { id: parseInt(id) },
      data: { paidAmount: currentPaid + parseFloat(amount) }
    });

    // Update daily stats
    await updateDailyStats(new Date());

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.activateRental = async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await prisma.rental.findUnique({
      where: { id: parseInt(id) },
      include: { payments: true }
    });

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    if (rental.isActivated) {
      return res.status(400).json({ message: 'Rental already activated' });
    }

    const startDate = new Date();
    const expectedReturn = new Date(startDate.getTime() + (24 * 60 * 60 * 1000)); // +24 heures

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRental = await tx.rental.update({
        where: { id: parseInt(id) },
        data: {
          isActivated: true,
          startDate: startDate,
          expectedReturn: expectedReturn
        }
      });

      return updatedRental;
    });

    await logAction(req.userData.userId, 'ACTIVATE_RENTAL', { rentalId: id, newReturnDate: expectedReturn });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRental = async (req, res) => {
  try {
    const { id } = req.params;
    const rentalId = parseInt(id);

    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Seul l\'administrateur peut supprimer une location.' });
    }

    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { items: true }
    });

    if (!rental) return res.status(404).json({ message: 'Location non trouvée' });

    const itemIds = rental.items.map(ri => ri.itemId);

    await prisma.$transaction(async (tx) => {
      // Release items if the rental was not already returned
      if (rental.status !== 'RETURNED') {
          await tx.item.updateMany({
            where: { id: { in: itemIds } },
            data: { status: 'AVAILABLE' }
          });
      }

      // Delete payments and movements
      await tx.payment.deleteMany({ where: { rentalId } });
      await tx.cashMovement.deleteMany({ where: { rentalId } });
      await tx.rentalItem.deleteMany({ where: { rentalId } });
      await tx.rental.delete({ where: { id: rentalId } });
    });

    await logAction(req.userData.userId, 'DELETE_RENTAL', { rentalId });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.returnRental = async (req, res) => {
  try {
    const { id } = req.params;
    const rental = await prisma.rental.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    });

    if (!rental) return res.status(404).json({ message: 'Rental not found' });

    const itemIds = rental.items.map(ri => ri.itemId);

    await prisma.$transaction(async (tx) => {
      await tx.rental.update({
        where: { id: parseInt(id) },
        data: {
          status: 'RETURNED',
          actualReturn: new Date()
        }
      });

      await tx.item.updateMany({
        where: { id: { in: itemIds } },
        data: { status: 'CLEANING' }
      });
    });

    await logAction(req.userData.userId, 'RETURN_RENTAL', { rentalId: id });

    res.json({ message: 'Items returned and moved to cleaning' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRental = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      firstName, lastName, phone, 
      items: selectedItems,
      startDate, expectedReturn, 
      totalAmount, paidAmount, discount, addedAmount, remarks,
      guaranteeDocument 
    } = req.body;

    const rentalId = parseInt(id);

    // Find existing rental
    const existingRental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { items: true }
    });

    if (!existingRental) return res.status(404).json({ message: 'Location non trouvée' });

    // Update customer if info changed
    await prisma.customer.update({
      where: { id: existingRental.customerId },
      data: { firstName, lastName, phone }
    });

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(expectedReturn);
    // Set to 12:00 PM to avoid late alert if returned same day at noon
    end.setHours(12, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Release old items
      const oldItemIds = existingRental.items.map(ri => ri.itemId);
      await tx.item.updateMany({
        where: { id: { in: oldItemIds } },
        data: { status: 'AVAILABLE' }
      });

      // 2. Delete old rental items
      await tx.rentalItem.deleteMany({ where: { rentalId } });

      // 3. Update rental details
      const updatedRental = await tx.rental.update({
        where: { id: rentalId },
        data: {
          startDate: start,
          expectedReturn: end,
          totalAmount: parseFloat(totalAmount),
          paidAmount: parseFloat(paidAmount),
          discount: parseFloat(discount),
          addedAmount: parseFloat(addedAmount) || 0,
          remarks: remarks || null,
          guaranteeDocument: guaranteeDocument || null,
          items: {
            create: selectedItems.map(item => ({ 
              itemId: parseInt(item.id),
              remarks: item.remarks || null,
              tailorModification: item.tailorModification || null
            }))
          }
        }
      });

      // 4. Update new items status
      const newItemIds = selectedItems.map(item => parseInt(item.id));
      await tx.item.updateMany({
        where: { id: { in: newItemIds } },
        data: { status: 'RENTED' }
      });

      return updatedRental;
    });

    await logAction(req.userData.userId, 'UPDATE_RENTAL', { rentalId: id });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
