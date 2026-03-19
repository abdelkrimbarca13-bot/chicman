const prisma = require('./src/utils/prisma');

async function test() {
  const req = { query: {} };
  const res = { json: (data) => console.log('Items returned:', data.length) };
  
  const itemController = require('./src/controllers/itemController');
  await itemController.getAllItems(req, res);
}

test();
