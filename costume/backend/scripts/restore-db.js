const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Commencer la restauration des données (VPS) ---');

  const backupPath = path.join(__dirname, 'backup_data.json');
  if (!fs.existsSync(backupPath)) {
    console.error(`Fichier de sauvegarde non trouvé: ${backupPath}`);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

  // 1. Vider toutes les tables dans le bon ordre pour éviter les violations de clés étrangères
  console.log('Nettoyage complet de la base de données...');
  await prisma.rentalItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.perfumeSale.deleteMany();
  await prisma.productSale.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.dailyCash.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.perfume.deleteMany();
  console.log('Base de données vidée avec succès.');

  // 2. Restaurer les Utilisateurs
  if (backup.users && backup.users.length > 0) {
    const usersToInsert = backup.users.map(u => ({
      ...u,
      createdAt: new Date(u.createdAt)
    }));
    await prisma.user.createMany({
      data: usersToInsert
    });
    console.log(`${usersToInsert.length} utilisateurs restaurés.`);
  } else {
    console.log('Aucun utilisateur à restaurer.');
  }

  // 3. Restaurer les Articles (Item)
  if (backup.items && backup.items.length > 0) {
    const itemsToInsert = backup.items.map(i => ({
      ...i,
      createdAt: new Date(i.createdAt),
      updatedAt: new Date(i.updatedAt)
    }));
    await prisma.item.createMany({
      data: itemsToInsert
    });
    console.log(`${itemsToInsert.length} articles restaurés.`);
  } else {
    console.log('Aucun article à restaurer.');
  }

  // 4. Restaurer les Produits Boutique (Product)
  if (backup.products && backup.products.length > 0) {
    const productsToInsert = backup.products.map(p => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt)
    }));
    await prisma.product.createMany({
      data: productsToInsert
    });
    console.log(`${productsToInsert.length} produits restaurés.`);
  } else {
    console.log('Aucun produit boutique à restaurer.');
  }

  // 5. Restaurer les Parfums (Perfume)
  if (backup.perfumes && backup.perfumes.length > 0) {
    const perfumesToInsert = backup.perfumes.map(pf => ({
      ...pf,
      createdAt: new Date(pf.createdAt),
      updatedAt: new Date(pf.updatedAt)
    }));
    await prisma.perfume.createMany({
      data: perfumesToInsert
    });
    console.log(`${perfumesToInsert.length} parfums restaurés.`);
  } else {
    console.log('Aucun parfum à restaurer.');
  }

  console.log('--- Restauration terminée avec succès ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
