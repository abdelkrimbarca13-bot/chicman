const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});

// Activer le mode WAL et le mode de synchronisation NORMAL pour optimiser les performances SQLite
prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;')
  .then(() => console.log('SQLite WAL mode enabled'))
  .catch(err => console.error('Failed to enable WAL mode:', err));

prisma.$executeRawUnsafe('PRAGMA synchronous=NORMAL;')
  .then(() => console.log('SQLite synchronous set to NORMAL'))
  .catch(err => console.error('Failed to set synchronous:', err));

module.exports = prisma;
