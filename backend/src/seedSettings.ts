import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSettings() {
  const defaults = [
    { key: 'token_price', value: '250' },
    { key: 'coin_price', value: '2500' },
    { key: 'payment_qr_url', value: '' },
  ];

  for (const setting of defaults) {
    await prisma.appSettings.upsert({
      where: { key: setting.key },
      update: {}, // don't overwrite existing values
      create: { key: setting.key, value: setting.value },
    });
  }

  console.log('✅ AppSettings seeded successfully');
}

seedSettings()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
