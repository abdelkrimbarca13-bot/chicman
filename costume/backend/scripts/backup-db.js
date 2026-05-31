const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Commencer la sauvegarde des données (VPS) ---');
  
  const backup = {
    users: [],
    items: [],
    products: [],
    perfumes: []
  };

  // 1. Sauvegarde des Utilisateurs
  try {
    const users = await prisma.user.findMany();
    backup.users = users;
    console.log(`Utilisateurs sauvegardés: ${users.length}`);
  } catch (e) {
    console.warn('Erreur lors de la sauvegarde de User (peut-être que la table n\'existe pas) :', e.message);
  }

  // 2. Sauvegarde des Articles (Items)
  try {
    const items = await prisma.item.findMany();
    backup.items = items;
    console.log(`Articles (Item) sauvegardés: ${items.length}`);
  } catch (e) {
    console.warn('Erreur lors de la sauvegarde de Item (peut-être que la table n\'existe pas) :', e.message);
  }

  // 3. Sauvegarde des Produits (Product) - Boutique
  try {
    const products = await prisma.product.findMany();
    backup.products = products;
    console.log(`Produits (Product) sauvegardés: ${products.length}`);
  } catch (e) {
    console.log('La table Product n\'existe pas encore dans la base de données actuelle.');
  }

  // 4. Sauvegarde des Parfums (Perfume)
  try {
    const perfumes = await prisma.perfume.findMany();
    backup.perfumes = perfumes;
    console.log(`Parfums (Perfume) sauvegardés: ${perfumes.length}`);
  } catch (e) {
    console.log('La table Perfume n\'existe pas encore dans la base de données actuelle.');
  }

  const backupPath = path.join(__dirname, 'backup_data.json');
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`Sauvegarde réussie dans : ${backupPath}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
