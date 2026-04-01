const prisma = require('../utils/prisma');

exports.getAuditLogs = async (req, res) => {
  try {
    if (req.userData.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
