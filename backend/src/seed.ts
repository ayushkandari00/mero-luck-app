import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Database Seeding...');

  // Clean old data
  await prisma.entry.deleteMany();
  await prisma.winner.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.physicalCoin.deleteMany();
  await prisma.digitalToken.deleteMany();
  await prisma.luckyNumber.deleteMany();
  await prisma.draw.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.address.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin
  // ⚠️  IMPORTANT: Change these passwords immediately after seeding in production!
  // Use: node -e "const b=require('bcryptjs'); b.hash('YourNewPassword', 12).then(console.log)"
  const adminPasswordHash = await bcrypt.hash('adminpassword123', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@meroluck.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phoneNumber: '9876543210',
      profile: {
        create: {
          firstName: 'Mero Luck',
          lastName: 'Admin',
          referralCode: 'MERO-ADMIN',
          kycStatus: 'APPROVED',
        },
      },
    },
  });
  console.log('Admin user created: admin@meroluck.com / adminpassword123');

  // Create Standard User
  const userPasswordHash = await bcrypt.hash('userpassword123', 12);
  const normalUser = await prisma.user.create({
    data: {
      email: 'user@meroluck.com',
      passwordHash: userPasswordHash,
      role: 'USER',
      phoneNumber: '9800000001',
      profile: {
        create: {
          firstName: 'Ayush',
          lastName: 'Sharma',
          referralCode: 'MERO-AYUSH',
          kycStatus: 'APPROVED',
          welcomeBonusClaimed: true,
        },
      },
      address: {
        create: {
          street: '123 Luxury Lane',
          city: 'Kathmandu',
          state: 'Bagmati',
          postalCode: '44600',
          country: 'Nepal',
        },
      },
    },
  });
  console.log('Normal test user created: user@meroluck.com / userpassword123');

  // Create Active Draw (in 6 months)
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

  const activeDraw = await prisma.draw.create({
    data: {
      title: 'Mero Luck Mega Draw #1',
      drawDate: sixMonthsFromNow,
      prizePool: 10000000, // Rs. 1 Crore (matching reference poster!)
      status: 'ACTIVE',
      grandPrize: 'Rs. 60 Lakhs + 24k Gold Engraved Coin',
      secondPrize: 'Rs. 25 Lakhs + Silver Coin',
      thirdPrize: 'Rs. 15 Lakhs',
      bonusRewards: '10x Special Mero Luck Silver Coins',
    },
  });
  console.log('Active Draw Created: Mero Luck Mega Draw #1 (1 Crore pool)');

  // Create a Past Completed Draw
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const pastDraw = await prisma.draw.create({
    data: {
      title: 'Mero Luck Inaugural Draw',
      drawDate: twoMonthsAgo,
      prizePool: 5000000, // Rs. 50 Lakhs
      status: 'COMPLETED',
      grandPrize: 'Rs. 30 Lakhs + Collector Coin #001',
      secondPrize: 'Rs. 12.5 Lakhs',
      thirdPrize: 'Rs. 7.5 Lakhs',
      bonusRewards: '5x Special Bonus Prizes',
    },
  });
  console.log('Past Draw Created: Mero Luck Inaugural Draw');

  // Seed Winners
  // Generate some lucky numbers for winner verification
  const num1 = await prisma.luckyNumber.create({
    data: { number: '568794', userId: normalUser.id }, // matching the reference image gold coin engraved number!
  });
  const num2 = await prisma.luckyNumber.create({
    data: { number: '124891' },
  });

  // Grand winner
  await prisma.winner.create({
    data: {
      drawId: pastDraw.id,
      userId: normalUser.id,
      prizeCategory: 'GRAND',
      prizeAmount: 3000000,
      verified: true,
    },
  });

  // Create a couple of notifications
  await prisma.notification.create({
    data: {
      userId: normalUser.id,
      message: '🎉 Congratulations! You have won the GRAND PRIZE (Rs. 30 Lakhs) in the Inaugural Draw with Lucky Number 568794!',
    },
  });

  console.log('Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
