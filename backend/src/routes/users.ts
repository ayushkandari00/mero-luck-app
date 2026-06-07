import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../db';

const router = Router();

// Get Current User Info, Profile, Address
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        address: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
});

// Update Profile & Address Info
router.post('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, phoneNumber, street, city, state, postalCode, country } = req.body;

    await prisma.$transaction(async (tx) => {
      // Update profile
      await tx.profile.update({
        where: { userId },
        data: {
          firstName,
          lastName,
        },
      });

      // Update phone if provided
      if (phoneNumber) {
        await tx.user.update({
          where: { id: userId },
          data: { phoneNumber },
        });
      }

      // Upsert address
      if (street || city || state || postalCode || country) {
        const existingAddress = await tx.address.findUnique({ where: { userId } });
        if (existingAddress) {
          await tx.address.update({
            where: { userId },
            data: { street, city, state, postalCode, country },
          });
        } else {
          await tx.address.create({
            data: {
              userId: userId!,
              street: street || '',
              city: city || '',
              state: state || '',
              postalCode: postalCode || '',
              country: country || '',
            },
          });
        }
      }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, address: true },
    });

    return res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Get User Coins
router.get('/coins', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const coins = await prisma.physicalCoin.findMany({
      where: { userId },
      include: { luckyNumber: true },
    });
    return res.json(coins);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to get coins', error: error.message });
  }
});

// Get User Tokens
router.get('/tokens', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const tokens = await prisma.digitalToken.findMany({
      where: { userId },
      include: { luckyNumber: true },
    });
    return res.json(tokens);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to get tokens', error: error.message });
  }
});

// Get Notifications
router.get('/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(notifications);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to get notifications', error: error.message });
  }
});

// Mark notifications read
router.post('/notifications/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return res.json({ message: 'Notifications marked as read' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update notifications', error: error.message });
  }
});

// Get User Dashboard Overview statistics
router.get('/dashboard-stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const coinsCount = await prisma.physicalCoin.count({ where: { userId } });
    const tokensCount = await prisma.digitalToken.count({ where: { userId } });
    const entriesCount = await prisma.entry.count({ where: { userId } });

    // Sum wins
    const wins = await prisma.winner.findMany({ where: { userId } });
    const totalWinsAmount = wins.reduce((acc, w) => acc + w.prizeAmount, 0);

    const profile = await prisma.profile.findUnique({ where: { userId } });
    const referralBonus = await prisma.referral.count({ where: { referrerId: userId, bonusStatus: 'GRANTED' } }) * 200; // e.g. ₹200 per referral

    return res.json({
      ownedCoins: coinsCount,
      ownedTokens: tokensCount,
      activeEntries: entriesCount,
      totalWins: wins.length,
      rewardsEarned: totalWinsAmount + (profile?.welcomeBonusClaimed ? 100 : 0) + referralBonus,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to load stats', error: error.message });
  }
});

export default router;
