import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { VALID_PAYMENT_METHODS, getPaymentDetails, verifyEsewaSignature } from '../utils/payment';

const router = Router();

// ─── Upload directory ────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── SECURITY: Strict file type + size validation ─────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF files are allowed.'));
    }
    cb(null, true);
  },
});

// ─── Shared: Assign ticket after payment verified ────────────────────────────
// This runs the same logic as admin approval: LuckyNumber → DigitalToken/PhysicalCoin → Entry
async function assignTicketForTransaction(transactionId: string, esewaCode?: string): Promise<{ luckyNumber: string }> {
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!transaction) throw new Error('Transaction not found');
  if (transaction.status === 'APPROVED') {
    // Already processed — find existing lucky number
    const existing = await prisma.luckyNumber.findFirst({ where: { userId: transaction.userId } });
    return { luckyNumber: existing?.number || '------' };
  }

  const activeDraw = await prisma.draw.findFirst({ where: { status: 'ACTIVE' } });

  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark transaction approved + store eSewa code
    await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'APPROVED',
        esewaTransactionCode: esewaCode || null,
      },
    });

    // 2. Generate unique 6-digit lucky number
    let luckyNumStr = '';
    let unique = false;
    while (!unique) {
      const num = Math.floor(100000 + Math.random() * 900000);
      luckyNumStr = num.toString();
      const existing = await tx.luckyNumber.findUnique({ where: { number: luckyNumStr } });
      if (!existing) unique = true;
    }

    const luckyNumber = await tx.luckyNumber.create({
      data: { number: luckyNumStr, userId: transaction.userId },
    });

    // 3. Assign the right ticket type
    if (transaction.type === 'TOKEN_PURCHASE') {
      await tx.digitalToken.create({
        data: {
          userId: transaction.userId,
          luckyNumberId: luckyNumber.id,
          status: 'ACTIVE',
        },
      });
    } else if (transaction.type === 'COIN_PURCHASE') {
      const serial = 'SN-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      await tx.physicalCoin.create({
        data: {
          userId: transaction.userId,
          luckyNumberId: luckyNumber.id,
          serialNumber: serial,
          shippingStatus: 'PROCESSING',
          status: 'APPROVED',
        },
      });
    } else if (transaction.type === 'NUMBERED_COIN_PURCHASE') {
      const numberedCoin = await tx.numberedCoin.findFirst({
        where: { transactionId: transaction.id },
      });
      if (numberedCoin) {
        await tx.numberedCoin.update({
          where: { id: numberedCoin.id },
          data: { status: 'SOLD', purchaseDate: new Date() },
        });
      }
    }

    // 4. Create draw entry (only if active draw exists)
    if (activeDraw) {
      await tx.entry.create({
        data: {
          drawId: activeDraw.id,
          userId: transaction.userId,
          luckyNumberId: luckyNumber.id,
          status: 'ACTIVE',
        },
      });
    }

    // 5. Notify user
    await tx.notification.create({
      data: {
        userId: transaction.userId,
        message: `🎉 Your payment of ₹${transaction.amount} was verified! Lucky Number ${luckyNumStr} has been assigned to you.`,
      },
    });

    return { luckyNumber: luckyNumStr };
  });

  return result;
}

// ─── Create Digital Token Order ───────────────────────────────────────────────
router.post('/buy-token', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { paymentMethod } = req.body;
    const tokenPriceSetting = await prisma.appSettings.findUnique({ where: { key: 'token_price' } });
    const price = tokenPriceSetting ? parseFloat(tokenPriceSetting.value) : 250;
    const orderId = 'ORD-TKN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const safePaymentMethod = VALID_PAYMENT_METHODS.includes(paymentMethod as any) ? paymentMethod : null;

    const transaction = await prisma.transaction.create({
      data: { userId, type: 'TOKEN_PURCHASE', amount: price, status: 'PENDING', orderId, paymentMethod: safePaymentMethod },
    });

    return res.json({
      message: 'Order created. Please make payment.',
      transaction,
      paymentDetails: getPaymentDetails(safePaymentMethod, orderId, price),
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create token order', error: error.message });
  }
});

// ─── Create Physical Coin Order ───────────────────────────────────────────────
router.post('/buy-coin', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { quantity, paymentMethod } = req.body;
    const qty = Math.min(10, Math.max(1, Number(quantity) || 1));
    const coinPriceSetting = await prisma.appSettings.findUnique({ where: { key: 'coin_price' } });
    const unitPrice = coinPriceSetting ? parseFloat(coinPriceSetting.value) : 2500;
    const price = unitPrice * qty;
    const orderId = 'ORD-COIN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const safePaymentMethod = VALID_PAYMENT_METHODS.includes(paymentMethod as any) ? paymentMethod : null;

    const address = await prisma.address.findUnique({ where: { userId } });
    if (!address) {
      return res.status(400).json({
        message: 'Shipping address required before buying physical coins.',
        noAddress: true,
      });
    }

    const transaction = await prisma.transaction.create({
      data: { userId, type: 'COIN_PURCHASE', amount: price, status: 'PENDING', orderId, paymentMethod: safePaymentMethod },
    });

    return res.json({
      message: 'Order created. Please make payment.',
      transaction,
      paymentDetails: getPaymentDetails(safePaymentMethod, orderId, price),
    });
  } catch (error: any) {
    console.error('[Buy Coin Error]', error);
    return res.status(500).json({ message: 'Failed to create coin order. Please try again.' });
  }
});

// ─── Get User's Transactions ──────────────────────────────────────────────────
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(transactions);
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

// ─── Verify eSewa Payment (called by success page) ───────────────────────────
// Auto-assigns ticket on success
router.post('/verify-esewa', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ message: 'Payment data is required.' });

    const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    const { isValid, parsedData } = verifyEsewaSignature(data, secretKey);

    if (!isValid) {
      return res.status(400).json({ message: 'Payment signature is invalid. Please contact support.' });
    }

    if (parsedData.status !== 'COMPLETE') {
      return res.status(400).json({
        message: 'Payment was not completed by eSewa.',
        esewaStatus: parsedData.status,
        orderId: parsedData.transaction_uuid,
      });
    }

    const orderId = parsedData.transaction_uuid;
    const transaction = await prisma.transaction.findUnique({ where: { orderId } });

    if (!transaction) {
      return res.status(404).json({ message: 'Order not found. Please contact support with your eSewa transaction ID.' });
    }

    // Verify amount match (eSewa returns amounts with commas like "1,000.0")
    const esewaAmount = parseFloat(parsedData.total_amount.replace(/,/g, ''));
    if (Math.abs(transaction.amount - esewaAmount) > 0.01) {
      return res.status(400).json({
        message: `Amount mismatch: expected ₹${transaction.amount}, got ₹${esewaAmount}. Contact support.`,
      });
    }

    // If already approved, just return the lucky number
    if (transaction.status === 'APPROVED') {
      const luckyNumber = await prisma.luckyNumber.findFirst({ where: { userId: transaction.userId } });
      return res.json({
        message: 'Payment already verified.',
        transaction,
        luckyNumber: luckyNumber?.number,
        esewaTransactionCode: parsedData.transaction_code,
      });
    }

    // Assign ticket and update transaction
    const { luckyNumber } = await assignTicketForTransaction(transaction.id, parsedData.transaction_code);
    const updatedTx = await prisma.transaction.findUnique({ where: { id: transaction.id } });

    return res.json({
      message: 'Payment verified and ticket assigned successfully!',
      transaction: updatedTx,
      luckyNumber,
      esewaTransactionCode: parsedData.transaction_code,
    });
  } catch (error: any) {
    console.error('[Verify eSewa Error]', error);
    return res.status(500).json({ message: 'Failed to verify payment. Please try again or report this issue.', error: error.message });
  }
});

// ─── Check Status (re-verify a pending order) ────────────────────────────────
// Called by "Check Payment Status" button on failure/pending page
router.post('/check-status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ message: 'orderId is required.' });

    const transaction = await prisma.transaction.findUnique({ where: { orderId } });
    if (!transaction) return res.status(404).json({ message: 'Order not found.' });

    // Security: only the owner can check
    if (transaction.userId !== req.user?.id) {
      return res.status(403).json({ message: 'You are not authorized to check this order.' });
    }

    if (transaction.status === 'APPROVED') {
      // Already done — fetch lucky number and return
      const luckyNumber = await prisma.luckyNumber.findFirst({ where: { userId: transaction.userId } });
      return res.json({
        status: 'APPROVED',
        message: 'Your payment was already verified and your ticket is assigned.',
        transaction,
        luckyNumber: luckyNumber?.number,
      });
    }

    if (transaction.status === 'REJECTED') {
      return res.json({
        status: 'REJECTED',
        message: 'This payment was rejected. Please contact support.',
        transaction,
      });
    }

    // Still PENDING — for eSewa, try to call their status API
    if (transaction.paymentMethod === 'esewa') {
      try {
        const merchantId = process.env.ESEWA_TEST_MERCHANT_ID || 'EPAYTEST';
        const esewaStatusUrl = `${process.env.ESEWA_STATUS_URL || 'https://uat.esewa.com.np/api/epay/transaction/status/'}?product_code=${merchantId}&total_amount=${transaction.amount}&transaction_uuid=${orderId}`;

        const esewaRes = await fetch(esewaStatusUrl);
        const esewaData = await esewaRes.json() as any;

        if (esewaData.status === 'COMPLETE') {
          const { luckyNumber } = await assignTicketForTransaction(transaction.id, esewaData.ref_id || '');
          const updatedTx = await prisma.transaction.findUnique({ where: { id: transaction.id } });
          return res.json({
            status: 'APPROVED',
            message: 'Payment confirmed via eSewa! Your ticket has been assigned.',
            transaction: updatedTx,
            luckyNumber,
          });
        }
      } catch (esewaError) {
        console.error('[eSewa Status Check Error]', esewaError);
        // Fall through to PENDING response if status API fails
      }
    }

    return res.json({
      status: 'PENDING',
      message: 'Your payment is still being processed. If you have paid, please wait a few minutes or report the issue.',
      transaction,
    });
  } catch (error: any) {
    console.error('[Check Status Error]', error);
    return res.status(500).json({ message: 'Failed to check payment status.', error: error.message });
  }
});

// ─── Report Payment Issue ──────────────────────────────────────────────────────
// Only used when payment is pending/disputed — screenshot upload is exclusive to this endpoint
router.post(
  '/report-issue',
  authenticateToken,
  (req, res, next) => {
    upload.single('screenshot')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Screenshot too large. Maximum size is 5MB.' });
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id!;
      const { esewaTransactionId, orderId, message } = req.body;

      if (!esewaTransactionId || esewaTransactionId.trim().length < 3) {
        return res.status(400).json({ message: 'eSewa Transaction ID is required (minimum 3 characters).' });
      }

      // If orderId provided, verify ownership
      let linkedTransactionId: string | undefined;
      if (orderId) {
        const transaction = await prisma.transaction.findUnique({ where: { orderId } });
        if (transaction && transaction.userId === userId) {
          linkedTransactionId = transaction.id;
        }
      }

      const screenshotUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

      const issue = await prisma.paymentIssue.create({
        data: {
          userId,
          transactionId: linkedTransactionId || null,
          esewaTransactionId: esewaTransactionId.trim(),
          screenshotUrl: screenshotUrl || null,
          message: message?.trim() || null,
          status: 'OPEN',
        },
      });

      // Notify user that issue was received
      await prisma.notification.create({
        data: {
          userId,
          message: `Your payment issue report (Ref: ${issue.id.slice(0, 8).toUpperCase()}) has been received. Admin will review within 24 hours.`,
        },
      });

      return res.json({
        message: 'Your issue has been reported successfully. Our team will review it within 24 hours.',
        issueId: issue.id,
        referenceCode: issue.id.slice(0, 8).toUpperCase(),
      });
    } catch (error: any) {
      console.error('[Report Issue Error]', error);
      return res.status(500).json({ message: 'Failed to submit issue report. Please try again.' });
    }
  }
);

// ─── Upload Payment Proof (kept for legacy manual flow) ──────────────────────
router.post('/upload-proof/:orderId', authenticateToken, (req, res, next) => {
  upload.single('receipt')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { orderId } = req.params;

    if (!req.file) return res.status(400).json({ message: 'Payment proof file is required.' });

    const transaction = await prisma.transaction.findUnique({ where: { orderId } });
    if (!transaction) return res.status(404).json({ message: 'Order not found.' });
    if (transaction.userId !== userId) return res.status(403).json({ message: 'Not authorized to upload proof for this order.' });
    if (transaction.status === 'APPROVED') return res.status(400).json({ message: 'This order is already approved.' });

    const relativePath = `/uploads/${req.file.filename}`;
    const updatedTransaction = await prisma.transaction.update({
      where: { orderId },
      data: { paymentProofUrl: relativePath, status: 'PENDING' },
    });

    await prisma.notification.create({
      data: { userId, message: `Payment proof uploaded for order ${orderId}. Admin is verifying.` },
    });

    return res.json({ message: 'Receipt uploaded successfully. Waiting for admin approval.', transaction: updatedTransaction });
  } catch (error: any) {
    console.error('[Upload Proof Error]', error);
    return res.status(500).json({ message: 'Upload failed. Please try again.' });
  }
});

export default router;
