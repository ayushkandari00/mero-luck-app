import { Router, Response } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import prisma from '../db';

const router = Router();

// Helper: Generate a unique 6-digit number not already registered
const generateUniqueLuckyNumber = async (): Promise<string> => {
  let unique = false;
  let numStr = '';
  while (!unique) {
    const num = Math.floor(100000 + Math.random() * 900000);
    numStr = num.toString();
    const existing = await prisma.luckyNumber.findUnique({ where: { number: numStr } });
    if (!existing) {
      unique = true;
    }
  }
  return numStr;
};

// Helper: Generate serial number for physical coins
const generateSerialNumber = () => {
  return 'SN-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
};

// Admin Dashboard stats
router.get('/dashboard-stats', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const pendingPaymentsCount = await prisma.transaction.count({ where: { status: 'PENDING', paymentProofUrl: { not: null } } });
    
    // Revenue calculations
    const approvedTransactions = await prisma.transaction.findMany({ where: { status: 'APPROVED' } });
    const totalRevenue = approvedTransactions.reduce((acc, t) => acc + t.amount, 0);

    const activeDraw = await prisma.draw.findFirst({ where: { status: 'ACTIVE' } });
    const totalPrizePool = activeDraw ? activeDraw.prizePool : 0;

    const coinsSold = await prisma.physicalCoin.count();
    const tokensSold = await prisma.digitalToken.count();

    const pendingKycCount = await prisma.profile.count({ where: { kycStatus: 'PENDING' } });

    return res.json({
      totalUsers,
      pendingPayments: pendingPaymentsCount,
      totalRevenue,
      prizePool: totalPrizePool,
      coinsSold,
      tokensSold,
      pendingKyc: pendingKycCount,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error fetching admin stats', error: error.message });
  }
});

// View all transactions (User purchases)
router.get('/transactions', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            email: true,
            phoneNumber: true,
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(transactions);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving transactions', error: error.message });
  }
});

// Approve Transaction Payment Proof -> Assign Token or Coin
router.post('/approve-payment/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'APPROVED') {
      return res.status(400).json({ message: 'Payment already approved' });
    }

    const activeDraw = await prisma.draw.findFirst({ where: { status: 'ACTIVE' } });
    if (!activeDraw) {
      return res.status(400).json({ message: 'No active draw found. Create a draw first.' });
    }

    // Run in Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update transaction status
      const updatedTx = await tx.transaction.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      // 2. Generate unique lucky number
      const numStr = await generateUniqueLuckyNumber();
      const luckyNumber = await tx.luckyNumber.create({
        data: {
          number: numStr,
          userId: transaction.userId,
        },
      });

      // 3. Assign Token or Coin
      if (transaction.type === 'TOKEN_PURCHASE') {
        await tx.digitalToken.create({
          data: {
            userId: transaction.userId,
            luckyNumberId: luckyNumber.id,
            status: 'ACTIVE',
          },
        });
      } else if (transaction.type === 'COIN_PURCHASE') {
        const serialNumber = generateSerialNumber();
        await tx.physicalCoin.create({
          data: {
            userId: transaction.userId,
            luckyNumberId: luckyNumber.id,
            serialNumber,
            shippingStatus: 'PROCESSING',
            status: 'APPROVED',
          },
        });
      } else if (transaction.type === 'NUMBERED_COIN_PURCHASE') {
        const numberedCoin = await tx.numberedCoin.findFirst({
          where: { transactionId: transaction.id }
        });
        if (numberedCoin) {
          await tx.numberedCoin.update({
            where: { id: numberedCoin.id },
            data: { status: 'SOLD', purchaseDate: new Date() }
          });
        }
      }

      // 4. Register active draw entry
      await tx.entry.create({
        data: {
          drawId: activeDraw.id,
          userId: transaction.userId,
          luckyNumberId: luckyNumber.id,
          status: 'ACTIVE',
        },
      });

      // 5. Notify the user
      await tx.notification.create({
        data: {
          userId: transaction.userId,
          message: `Your payment of ₹${transaction.amount} has been approved! Lucky Number ${numStr} is now assigned to you.`,
        },
      });

      return { numStr };
    });

    return res.json({
      message: `Payment approved. Assigned Lucky Number: ${result.numStr}`,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to approve payment', error: error.message });
  }
});

// Reject payment
router.post('/reject-payment/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const tx = await prisma.transaction.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    if (tx.type === 'NUMBERED_COIN_PURCHASE') {
      const numberedCoin = await prisma.numberedCoin.findFirst({
        where: { transactionId: tx.id }
      });
      if (numberedCoin) {
        await prisma.numberedCoin.update({
          where: { id: numberedCoin.id },
          data: { status: 'AVAILABLE', userId: null, transactionId: null }
        });
      }
    }

    await prisma.notification.create({
      data: {
        userId: tx.userId,
        message: `Your payment of ₹${tx.amount} has been rejected. Please review payment proof or contact support.`,
      },
    });

    return res.json({ message: 'Payment proof rejected.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to reject payment', error: error.message });
  }
});

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      // ─── SECURITY M2: Explicitly exclude passwordHash from admin user list ────
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        profile: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(users);
  } catch (error: any) {
    console.error('[Admin Users Error]', error);
    return res.status(500).json({ message: 'Error retrieving users.' });
  }
});

// Update User KYC Status
router.post('/users/:id/kyc', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  // ─── SECURITY H3: Enum validation for KYC status ─────────────────────────
  const validStatuses = ['APPROVED', 'REJECTED', 'PENDING'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `Invalid KYC status. Must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    await prisma.profile.update({
      where: { userId: id },
      data: { kycStatus: status },
    });

    await prisma.notification.create({
      data: {
        userId: id,
        message: `Your KYC verification request has been ${status === 'APPROVED' ? 'Approved! You can now participate fully.' : 'Rejected. Please re-upload documents.'}`,
      },
    });

    return res.json({ message: `KYC updated to ${status}` });
  } catch (error: any) {
    console.error('[KYC Update Error]', error);
    return res.status(500).json({ message: 'Error updating KYC status.' });
  }
});

// Draw Management: Create Draw
router.post('/draws', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { title, drawDate, prizePool, grandPrize, secondPrize, thirdPrize, bonusRewards } = req.body;
  try {
    const draw = await prisma.draw.create({
      data: {
        title,
        drawDate: new Date(drawDate),
        prizePool: Number(prizePool),
        grandPrize,
        secondPrize,
        thirdPrize,
        bonusRewards,
        status: 'ACTIVE',
      },
    });
    return res.status(201).json({ message: 'Draw created successfully', draw });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create draw', error: error.message });
  }
});

// Select Winner for a Draw (Simulated seed random check)
router.post('/draws/:id/pick-winners', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const draw = await prisma.draw.findUnique({
      where: { id },
      include: { entries: true },
    });

    if (!draw) {
      return res.status(404).json({ message: 'Draw not found' });
    }

    if (draw.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Winners have already been picked for this draw.' });
    }

    if (draw.entries.length === 0) {
      return res.status(400).json({ message: 'No entries registered for this draw.' });
    }

    // Standard draw close and picking
    // In a production app, we would perform public block hash lookup
    // Shuffling entries
    const entries = [...draw.entries];
    const shuffled = entries.sort(() => Math.random() - 0.5);

    const grandWinnerEntry = shuffled[0];
    const secondWinnerEntry = shuffled[1] || shuffled[0];
    const thirdWinnerEntry = shuffled[2] || shuffled[0];

    const results = await prisma.$transaction(async (tx) => {
      // Update draw status
      await tx.draw.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      // Update entries status
      await tx.entry.updateMany({
        where: { drawId: id },
        data: { status: 'LOST' },
      });

      // Create winner models
      const w1 = await tx.winner.create({
        data: {
          drawId: id,
          userId: grandWinnerEntry.userId,
          prizeCategory: 'GRAND',
          prizeAmount: draw.prizePool * 0.6, // 60% pool
          verified: true,
        },
      });

      await tx.entry.update({
        where: { id: grandWinnerEntry.id },
        data: { status: 'WINNER' },
      });

      let w2, w3;
      if (shuffled[1]) {
        w2 = await tx.winner.create({
          data: {
            drawId: id,
            userId: secondWinnerEntry.userId,
            prizeCategory: 'SECOND',
            prizeAmount: draw.prizePool * 0.25, // 25% pool
            verified: true,
          },
        });
        await tx.entry.update({
          where: { id: secondWinnerEntry.id },
          data: { status: 'WINNER' },
        });
      }

      if (shuffled[2]) {
        w3 = await tx.winner.create({
          data: {
            drawId: id,
            userId: thirdWinnerEntry.userId,
            prizeCategory: 'THIRD',
            prizeAmount: draw.prizePool * 0.15, // 15% pool
            verified: true,
          },
        });
        await tx.entry.update({
          where: { id: thirdWinnerEntry.id },
          data: { status: 'WINNER' },
        });
      }

      // Notify the grand winner
      await tx.notification.create({
        data: {
          userId: grandWinnerEntry.userId,
          message: `🎉 JACKPOT! You won the GRAND PRIZE in "${draw.title}"! Claim your ₹${draw.prizePool * 0.6} now!`,
        },
      });

      return { w1, w2, w3 };
    });

    return res.json({
      message: 'Draw completed and winners announced!',
      winners: results,
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to pick winners', error: error.message });
  }
});

export default router;
