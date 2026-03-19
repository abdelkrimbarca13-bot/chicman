// const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const items = await prisma.item.findMany();
    console.log('Items in DB:', items.length);
    const statuses = items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
    }, {});
    console.log('Statuses:', statuses);
    
    // Check if some items are missing names or references
    const incomplete = items.filter(i => !i.name || !i.reference || !i.type);
    if (incomplete.length > 0) {
        console.log('Incomplete items found:', incomplete.length);
        console.log('Example incomplete:', incomplete[0]);
    } else {
        console.log('All items have name, reference, and type');
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
