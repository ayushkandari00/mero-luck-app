import { Router, Response } from 'express';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';
import prisma from '../db';

const router = Router();

// Get paginated coins (Marketplace)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;
    const status = req.query.status as string; // AVAILABLE, SOLD, RESERVED
    const search = req.query.search as string; // Exact coin number search
    
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.coinNumber = search;
    }

    const coins = await prisma.numberedCoin.findMany({
      where,
      skip,
      take: limit,
      orderBy: { coinNumber: 'asc' },
      include: {
        user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } }
      }
    });

    const totalCount = await prisma.numberedCoin.count({ where });

    return res.json({
      coins,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch numbered coins', error: error.message });
  }
});

// Dashboard Analytics for Coins
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const totalCoins = 100000;
    const soldCoins = await prisma.numberedCoin.count({ where: { status: 'SOLD' } });
    const reservedCoins = await prisma.numberedCoin.count({ where: { status: 'RESERVED' } });
    const availableCoins = await prisma.numberedCoin.count({ where: { status: 'AVAILABLE' } });
    
    const recentPurchases = await prisma.numberedCoin.findMany({
      where: { status: 'SOLD' },
      orderBy: { purchaseDate: 'desc' },
      take: 10,
      include: {
        user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } }
      }
    });

    // Standard coin price
    const price = 1000;
    const revenueGenerated = soldCoins * price;

    return res.json({
      totalCoins,
      soldCoins,
      availableCoins,
      reservedCoins,
      revenueGenerated,
      percentageSold: ((soldCoins / totalCoins) * 100).toFixed(2),
      recentPurchases
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Purchase a Specific Coin
router.post('/purchase', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { coinNumber, paymentMethod } = req.body; // paymentMethod: esewa | khalti | phonepay
    const price = 1000; // Standard cost: Numbered Coin = ₹1000

    if (!coinNumber) {
      return res.status(400).json({ message: 'Coin number is required' });
    }

    const coin = await prisma.numberedCoin.findUnique({ where: { coinNumber } });
    if (!coin) {
      return res.status(404).json({ message: 'Coin not found' });
    }

    if (coin.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Coin is not available for purchase' });
    }

    const orderId = 'ORD-NUM-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'NUMBERED_COIN_PURCHASE',
          amount: price,
          status: 'PENDING',
          orderId,
          paymentMethod: paymentMethod || null,
        },
      });

      await tx.numberedCoin.update({
        where: { id: coin.id },
        data: {
          status: 'RESERVED',
          userId,
          transactionId: transaction.id,
        }
      });

      return transaction;
    });

    return res.json({
      message: 'Order created and coin reserved. Please make payment and upload receipt.',
      transaction: result,
      paymentDetails: {
        upiId: 'meroluck@bank',
        accountHolder: 'Mero Luck Collectibles Pvt Ltd',
        bankName: 'Nepal Investment Mega Bank',
        accountNumber: '00100200300405',
        ifsc: 'NIMB0000001',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to purchase coin', error: error.message });
  }
});

export default router;
