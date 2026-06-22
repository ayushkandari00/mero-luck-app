import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../db';
import { VALID_PAYMENT_METHODS, getPaymentDetails } from '../utils/payment';

const router = Router();

// Create uploads directory if not exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── SECURITY C4: Strict file type + size validation ─────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Use only the extension we validated — don't trust originalname for the full path
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF files are allowed.'));
    }
    cb(null, true);
  },
});

// Create Digital Token Purchase Order
router.post('/buy-token', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { paymentMethod } = req.body; // esewa | khalti | phonepay | fonepay
    // Standard cost: Digital token = ₹250
    const price = 250; 
    const orderId = 'ORD-TKN-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const safePaymentMethod = VALID_PAYMENT_METHODS.includes(paymentMethod as any) ? paymentMethod : null;

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'TOKEN_PURCHASE',
        amount: price,
        status: 'PENDING',
        orderId,
        paymentMethod: safePaymentMethod,
      },
    });

    return res.json({
      message: 'Order created. Please make payment and upload receipt.',
      transaction,
      paymentDetails: getPaymentDetails(safePaymentMethod, orderId),
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to create token order', error: error.message });
  }
});

// Create Physical Coin Purchase Order
router.post('/buy-coin', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { quantity, paymentMethod } = req.body;
    // ─── SECURITY H4: Clamp quantity 1-10, never trust client ───────────────
    const qty = Math.min(10, Math.max(1, Number(quantity) || 1));
    const price = 2500 * qty;
    const orderId = 'ORD-COIN-' + Math.random().toString(36).substring(2, 10).toUpperCase();

    const safePaymentMethod = VALID_PAYMENT_METHODS.includes(paymentMethod as any) ? paymentMethod : null;

    const address = await prisma.address.findUnique({ where: { userId } });
    if (!address) {
      return res.status(400).json({
        message: 'Shipping address required before buying physical coins. Please update your profile shipping address.',
        noAddress: true
      });
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: 'COIN_PURCHASE',
        amount: price,
        status: 'PENDING',
        orderId,
        paymentMethod: safePaymentMethod,
      },
    });

    return res.json({
      message: 'Order created. Please make payment and upload receipt.',
      transaction,
      paymentDetails: getPaymentDetails(safePaymentMethod, orderId),
    });
  } catch (error: any) {
    console.error('[Buy Coin Error]', error);
    return res.status(500).json({ message: 'Failed to create coin order. Please try again.' });
  }
});

// Upload Payment Proof
router.post('/upload-proof/:orderId', authenticateToken, (req, res, next) => {
  upload.single('receipt')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      }
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

    if (!req.file) {
      return res.status(400).json({ message: 'Payment proof file is required' });
    }

    const transaction = await prisma.transaction.findUnique({ where: { orderId } });
    if (!transaction) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // ─── SECURITY: Verify ownership before accepting upload ────────────────
    if (transaction.userId !== userId) {
      return res.status(403).json({ message: 'You are not authorized to upload proof for this order.' });
    }

    // Don't allow re-uploading after already approved
    if (transaction.status === 'APPROVED') {
      return res.status(400).json({ message: 'This order is already approved. No further uploads needed.' });
    }

    const relativePath = `/uploads/${req.file.filename}`;

    const updatedTransaction = await prisma.transaction.update({
      where: { orderId },
      data: {
        paymentProofUrl: relativePath,
        status: 'PENDING',
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        message: `Payment proof uploaded for order ${orderId}. Admin is verifying.`,
      },
    });

    return res.json({
      message: 'Receipt uploaded successfully. Waiting for admin approval.',
      transaction: updatedTransaction,
    });
  } catch (error: any) {
    console.error('[Upload Proof Error]', error);
    return res.status(500).json({ message: 'Upload failed. Please try again.' });
  }
});

// Get User's Transactions
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

export default router;
