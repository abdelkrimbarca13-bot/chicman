const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient({});

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Create Admin
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Delete existing data to start fresh
  await prisma.rentalItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.item.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.dailyCash.deleteMany();

  const items = [
    // Vestes
    { reference: 'VS-001', name: 'Veste Blazer Slim', type: 'Veste', size: '50', color: 'Noir', rentalPrice: 2500, status: 'AVAILABLE' },
    { reference: 'VS-002', name: 'Veste Smoking Satin', type: 'Veste', size: '52', color: 'Bleu Nuit', rentalPrice: 3500, status: 'AVAILABLE' },
    { reference: 'VS-003', name: 'Veste Croisée Laine', type: 'Veste', size: '48', color: 'Gris', rentalPrice: 3000, status: 'AVAILABLE' },
    { reference: 'VS-004', name: 'Veste Velours Royale', type: 'Veste', size: '54', color: 'Bordeaux', rentalPrice: 4000, status: 'AVAILABLE' },
    { reference: 'VS-005', name: 'Veste Lin Été', type: 'Veste', size: '50', color: 'Beige', rentalPrice: 2800, status: 'AVAILABLE' },

    // Chemises
    { reference: 'CH-001', name: 'Chemise Col Cassé', type: 'Chemise', size: 'M', color: 'Blanc', rentalPrice: 1000, status: 'AVAILABLE' },
    { reference: 'CH-002', name: 'Chemise Mousquetaire', type: 'Chemise', size: 'L', color: 'Bleu Ciel', rentalPrice: 1200, status: 'AVAILABLE' },
    { reference: 'CH-003', name: 'Chemise Coton Égypte', type: 'Chemise', size: 'XL', color: 'Blanc', rentalPrice: 1500, status: 'AVAILABLE' },
    { reference: 'CH-004', name: 'Chemise Slim Fit', type: 'Chemise', size: 'S', color: 'Rose Pâle', rentalPrice: 1000, status: 'AVAILABLE' },
    
    // Gilets
    { reference: 'GL-001', name: 'Gilet de Costume', type: 'Gilet', size: '50', color: 'Gris', rentalPrice: 1500, status: 'AVAILABLE' },
    { reference: 'GL-002', name: 'Gilet Soie Mariage', type: 'Gilet', size: '48', color: 'Ivoire', rentalPrice: 2000, status: 'AVAILABLE' },
    { reference: 'GL-003', name: 'Gilet Double Boutonnage', type: 'Gilet', size: '52', color: 'Bleu', rentalPrice: 1800, status: 'AVAILABLE' },

    // Pantalons
    { reference: 'PT-001', name: 'Pantalon Coupe Droite', type: 'Pantalon', size: '42', color: 'Noir', rentalPrice: 1500, status: 'AVAILABLE' },
    { reference: 'PT-002', name: 'Pantalon Slim Fit', type: 'Pantalon', size: '40', color: 'Gris Anthracite', rentalPrice: 1500, status: 'AVAILABLE' },
    { reference: 'PT-003', name: 'Pantalon Chino Chic', type: 'Pantalon', size: '44', color: 'Beige', rentalPrice: 1200, status: 'AVAILABLE' },
    { reference: 'PT-004', name: 'Pantalon Laine Super 120', type: 'Pantalon', size: '42', color: 'Marine', rentalPrice: 2000, status: 'AVAILABLE' },

    // Chaussures
    { reference: 'CS-001', name: 'Richelieu Cuir', type: 'Chaussures', size: '42', color: 'Noir', rentalPrice: 2000, status: 'AVAILABLE' },
    { reference: 'CS-002', name: 'Mocassins Daim', type: 'Chaussures', size: '43', color: 'Marron', rentalPrice: 1800, status: 'AVAILABLE' },
    { reference: 'CS-003', name: 'Derbies Vernis', type: 'Chaussures', size: '41', color: 'Noir', rentalPrice: 2500, status: 'AVAILABLE' },

    // Karakou & Djabadour
    { reference: 'KK-001', name: 'Veste Karakou Brodé', type: 'Karakou', size: '40', color: 'Velours Noir', rentalPrice: 8000, status: 'AVAILABLE' },
    { reference: 'KK-002', name: 'Karakou Moderne Argent', type: 'Karakou', size: '38', color: 'Gris', rentalPrice: 7500, status: 'AVAILABLE' },
    { reference: 'DJ-001', name: 'Djabadour Traditionnel', type: 'Djabadour', size: 'L', color: 'Blanc & Or', rentalPrice: 6000, status: 'AVAILABLE' },
    { reference: 'DJ-002', name: 'Djabadour Royal', type: 'Djabadour', size: 'XL', color: 'Vert Émeraude', rentalPrice: 6500, status: 'AVAILABLE' },

    // Accessoires
    { reference: 'ACC-001', name: 'Ceinture Cuir Luxe', type: 'Ceinture', size: '95', color: 'Noir', rentalPrice: 500, status: 'AVAILABLE' },
    { reference: 'ACC-002', name: 'Cravate Soie Italienne', type: 'Cravate', size: 'Unique', color: 'Rouge Bordeaux', rentalPrice: 300, status: 'AVAILABLE' },
    { reference: 'ACC-003', name: 'Gilet Accessoire Fantaisie', type: 'Gilet accessoire', size: 'L', color: 'Motif Floral', rentalPrice: 1000, status: 'AVAILABLE' },
    { reference: 'ACC-004', name: 'Nœud Papillon Soie', type: 'Cravate', size: 'Unique', color: 'Noir', rentalPrice: 400, status: 'AVAILABLE' },
    { reference: 'ACC-005', name: 'Pochette de Costume', type: 'Cravate', size: 'Unique', color: 'Blanc', rentalPrice: 200, status: 'AVAILABLE' },
  ];

  await prisma.item.createMany({
    data: items,
  });

  const customers = [
    {
      firstName: 'Ahmed',
      lastName: 'Mansouri',
      phone: '0550123456',
      address: 'Alger, Centre',
      idNumber: '123456789012',
      email: 'ahmed@example.com'
    },
    {
      firstName: 'Karim',
      lastName: 'Brahimi',
      phone: '0661987654',
      address: 'Oran, Ville',
      idNumber: '987654321098',
      email: 'karim@example.com'
    },
    {
      firstName: 'Yacine',
      lastName: 'Zidane',
      phone: '0770554433',
      address: 'Constantine',
      idNumber: '456123789012',
      email: 'yacine@example.com'
    }
  ];

  for (const customer of customers) {
    await prisma.customer.create({
      data: customer
    });
  }

  console.log('Database cleared and seed completed successfully with expanded dataset');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
