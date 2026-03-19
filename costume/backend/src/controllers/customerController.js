const prisma = require('../utils/prisma');

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
        include: { rentals: true }
    });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const customer = await prisma.customer.create({ data: req.body });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: req.body
    });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.customer.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
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
