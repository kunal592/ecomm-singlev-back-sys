import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      name: 'Store Admin',
      phone: '9999999999',
      email: 'admin@myshop.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log('Admin created:', admin.name);

  // Create Categories
  const cat1 = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: { name: 'Electronics', slug: 'electronics' },
  });

  const cat2 = await prisma.category.upsert({
    where: { slug: 'fashion' },
    update: {},
    create: { name: 'Fashion', slug: 'fashion' },
  });

  // Create Products
  await prisma.product.createMany({
    data: [
      {
        name: 'iPhone 15',
        description: 'Newest iPhone model',
        price: 79999,
        stock: 50,
        categoryId: cat1.id,
        images: ['https://images.unsplash.com/photo-1696446701796-da61225697cc'],
      },
      {
        name: 'MacBook Air M2',
        description: 'Light and powerful laptop',
        price: 99999,
        stock: 20,
        categoryId: cat1.id,
        images: ['https://images.unsplash.com/photo-1611186871348-b1ec696e5237'],
      },
      {
        name: 'Leather Jacket',
        description: 'Premium black leather jacket',
        price: 4999,
        discountedPrice: 3999,
        stock: 100,
        categoryId: cat2.id,
        images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5'],
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
