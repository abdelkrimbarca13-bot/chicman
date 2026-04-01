const prisma = require('./prisma');

exports.logAction = async (userId, action, details) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details: details ? JSON.stringify(details) : null
      }
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};
