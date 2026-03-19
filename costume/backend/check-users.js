const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const users = await prisma.user.findMany();
    console.log('--- USER DATABASE CHECK ---');
    console.log('User count:', users.length);
    console.log('Usernames:', users.map(u => u.username).join(', '));
    if (users.length === 0) {
        console.log('WARNING: The User table is empty! Use "npm run seed" to create the admin account.');
    }
  } catch (err) {
    console.error('Error checking users:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
