const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Seul l'admin peut créer d'autres comptes
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Seul l\'administrateur peut créer des comptes.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashedPassword, role: role || 'EMPLOYEE' }
    });
    res.status(201).json({ message: 'Compte créé !', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const users = await prisma.user.findMany({
      select: { id: true, username: true, role: true, isActive: true, createdAt: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, isActive } = req.body;

    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    let updateData = {};
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({ message: 'Utilisateur mis à jour !', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    
    // Empêcher de se supprimer soi-même
    if (parseInt(id) === req.userData.userId) {
        return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }

    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ message: 'Auth failed' });
    if (!user.isActive) return res.status(403).json({ message: 'Compte désactivé' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Auth failed' });

    const token = jwt.sign(
      { userId: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );
    res.status(200).json({ token, userId: user.id, role: user.role, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
