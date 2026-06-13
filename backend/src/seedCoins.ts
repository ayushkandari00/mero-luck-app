import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed for 100,000 numbered coins...');
  
  const totalCoins = 100000;
  const batchSize = 10000; // SQLite can handle 10k per batch comfortably
  
  for (let i = 0; i < totalCoins; i += batchSize) {
    const batch = [];
    for (let j = 1; j <= batchSize; j++) {
      const num = i + j;
      const coinNumber = num.toString().padStart(6, '0');
      batch.push({
        coinNumber,
        status: 'AVAILABLE',
      });
    }
    
    await prisma.numberedCoin.createMany({
      data: batch,
    });
    
    console.log(`Seeded batch ${i / batchSize + 1} / ${totalCoins / batchSize}`);
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
