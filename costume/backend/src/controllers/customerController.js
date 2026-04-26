const prisma = require('../utils/prisma');
const { logAction } = require('../utils/audit');

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
        include: { rentals: true }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    await logAction(req.userData.userId, 'CREATE_CUSTOMER', { customerId: customer.id, name: `${customer.firstName} ${customer.lastName}` });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: req.body
    });
    await logAction(req.userData.userId, 'UPDATE_CUSTOMER', { customerId: id, name: `${customer.firstName} ${customer.lastName}` });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.toggleBlacklist = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlacklisted } = req.body;
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: { isBlacklisted: !!isBlacklisted }
    });
    await logAction(req.userData.userId, 'TOGGLE_BLACKLIST', { customerId: id, name: `${customer.firstName} ${customer.lastName}`, isBlacklisted: !!isBlacklisted });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Seul l'admin peut supprimer (la vérification se fera dans les routes/middleware idéalement, mais on peut ajouter ici)
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Seul l\'administrateur peut supprimer un client.' });
    }

    // Check if customer has rentals
    const rentalsCount = await prisma.rental.count({
      where: { customerId: parseInt(id) }
    });

    if (rentalsCount > 0) {
      return res.status(400).json({ 
        message: "Impossible de supprimer ce client car il possède des locations enregistrées." 
      });
    }
    
    await prisma.customer.delete({
      where: { id: parseInt(id) }
    });
    
    await logAction(req.userData.userId, 'DELETE_CUSTOMER', { customerId: id });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.message });
  }
};

exports.getCustomerRentals = async (req, res) => {
    try {
        const { id } = req.params;
        const rentals = await prisma.rental.findMany({
            where: { customerId: parseInt(id) },
            include: { items: { include: { item: true } } }
        });
        res.json(rentals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
