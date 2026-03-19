const prisma = require('../utils/prisma');
const { updateDailyStats } = require('./cashController');

exports.createRental = async (req, res) => {
  try {
    const { 
      firstName, lastName, phone, 
      items: selectedItems, // items: [{ id, remarks }]
      startDate, expectedReturn, 
      totalAmount, paidAmount, discount, remarks,
      guaranteeDocument 
    } = req.body;

    const itemIds = selectedItems.map(i => i.id);

    // Find or create customer by phone
    let customer = await prisma.customer.findFirst({
      where: { phone: phone }
    });

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
    const end = new Date(expectedReturn);

    // Check items availability
    const overlappingRentals = await prisma.rentalItem.findMany({
      where: {
        itemId: { in: itemIds },
        rental: {
          status: { in: ['ONGOING', 'DELAYED'] },
          AND: [
            { startDate: { lte: end } },
            { expectedReturn: { gte: start } }
          ]
        }
      },
      include: { item: true }
    });

    if (overlappingRentals.length > 0) {
      return res.status(400).json({ 
        message: 'Certains articles sont déjà loués pour ces dates', 
        items: overlappingRentals.map(r => r.item.name) 
      });
    }

    // Physical status check
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } }
    });

    const unavailableItems = items.filter(item => item.status !== 'AVAILABLE');
    if (unavailableItems.length > 0) {
      return res.status(400).json({ 
        message: 'Certains articles ne sont pas physiquement disponibles (en nettoyage ou réparation)', 
        items: unavailableItems.map(i => i.name) 
      });
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

    const currentPaid = rental.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainder = Math.max(0, rental.totalAmount - currentPaid);

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRental = await tx.rental.update({
        where: { id: parseInt(id) },
        data: {
          isActivated: true,
          paidAmount: rental.totalAmount
        }
      });

      // Add remainder to cash only if there's a remainder
      if (remainder > 0) {
        await tx.payment.create({
          data: {
            amount: remainder,
            rentalId: parseInt(id)
          }
        });

        await tx.cashMovement.create({
          data: {
            rentalId: parseInt(id),
            amount: remainder,
            type: 'REMAINDER',
            description: `Solde restant activation - Location #${id}`,
            date: new Date()
          }
        });
      }

      return updatedRental;
    });

    // Update daily stats
    if (remainder > 0) {
      await updateDailyStats(new Date());
    }

    res.json(updated);
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

    res.json({ message: 'Items returned and moved to cleaning' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
