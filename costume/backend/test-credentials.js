const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const dbPath = path.resolve(__dirname, 'prisma', 'dev.db');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

async function testLogin() {
  const username = 'admin';
  const password = 'admin123';

  console.log(`Testing login for: ${username} / ${password}`);

  const user = await prisma.user.findUnique({ where: { username } });
  
  if (!user) {
    console.log('User NOT found in database');
    return;
  }

  console.log('User found in database. Hashed password:', user.password);

  const isValid = await bcrypt.compare(password, user.password);
  console.log('Password comparison result:', isValid ? 'SUCCESS' : 'FAILED');
}

testLogin()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
