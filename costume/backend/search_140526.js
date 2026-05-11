const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  try {
    const allTables = ['dailyCash', 'payment', 'expense', 'withdrawal', 'sale', 'rental'];
    for (const t of allTables) {
      const records = await p[t].findMany();
      records.forEach(r => {
        if (JSON.stringify(r).includes('140526')) {
            console.log(`Found in ${t}:`, r);
        }
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await p.$disconnect();
  }
}
main();
