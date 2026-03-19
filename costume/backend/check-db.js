const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const itemCount = await prisma.item.count();
    const items = await prisma.item.findMany({ take: 5 });
    console.log('--- DATABASE STATUS ---');
    console.log('Total items in DB:', itemCount);
    console.log('First 5 items references:', items.map(i => i.reference));
    
    const users = await prisma.user.findMany();
    console.log('Users in DB:', users.map(u => u.username));
    
    console.log('--- END STATUS ---');
  } catch (error) {
    console.error('Error checking DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
