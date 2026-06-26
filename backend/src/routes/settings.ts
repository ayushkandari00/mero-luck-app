import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import prisma from '../db';

const router = Router();

// ─── QR Upload Storage ────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_QR_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_QR_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_QR_SIZE = 2 * 1024 * 1024; // 2 MB

const qrStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `qr-${Date.now()}${ext}`);
  },
});

const qrUpload = multer({
  storage: qrStorage,
  limits: { fileSize: MAX_QR_SIZE },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_QR_MIME.includes(file.mimetype) || !ALLOWED_QR_EXT.includes(ext)) {
      return cb(new Error('Only JPEG, PNG, or WebP images are allowed for the QR code.'));
    }
    cb(null, true);
  },
});

// ─── DEFAULT SETTINGS ─────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: Record<string, string> = {
  token_price: '250',
  coin_price: '2500',
  payment_qr_url: '',
};

// ─── GET /api/settings/public — no auth required ─────────────────────────────
// Returns only the public-facing settings (prices + QR URL)
router.get('/public', async (_req, res: Response) => {
  try {
    const settings = await prisma.appSettings.findMany({
      where: { key: { in: ['token_price', 'coin_price', 'payment_qr_url'] } },
    });

    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of settings) {
      result[s.key] = s.value;
    }

    return res.json(result);
  } catch (error: any) {
    console.error('[Settings Public Error]', error);
    return res.status(500).json({ message: 'Failed to fetch settings.' });
  }
});

// ─── GET /api/settings — admin only ──────────────────────────────────────────
router.get('/', authenticateToken, requireAdmin, async (_req, res: Response) => {
  try {
    const settings = await prisma.appSettings.findMany();
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return res.json(result);
  } catch (error: any) {
    console.error('[Settings Get Error]', error);
    return res.status(500).json({ message: 'Failed to fetch settings.' });
  }
});

// ─── PUT /api/settings/:key — admin only ─────────────────────────────────────
// Allowed keys are strictly validated to prevent arbitrary DB writes
const EDITABLE_KEYS = ['token_price', 'coin_price', 'payment_qr_url'];

router.put('/:key', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;

  if (!EDITABLE_KEYS.includes(key)) {
    return res.status(400).json({ message: `Invalid setting key. Allowed: ${EDITABLE_KEYS.join(', ')}` });
  }

  if (value === undefined || value === null) {
    return res.status(400).json({ message: 'Value is required.' });
  }

  // Extra validation for price fields
  if (key === 'token_price' || key === 'coin_price') {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number.' });
    }
  }

  try {
    const setting = await prisma.appSettings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return res.json({ message: `Setting "${key}" updated successfully.`, setting });
  } catch (error: any) {
    console.error('[Settings Update Error]', error);
    return res.status(500).json({ message: 'Failed to update setting.' });
  }
});

// ─── POST /api/settings/upload-qr — admin only ───────────────────────────────
router.post(
  '/upload-qr',
  authenticateToken,
  requireAdmin,
  (req, res, next) => {
    qrUpload.single('qr')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'QR image too large. Maximum size is 2MB.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'QR image file is required.' });
      }

      const relativePath = `/uploads/${req.file.filename}`;

      // Remove old QR file from disk if it was locally stored
      const existing = await prisma.appSettings.findUnique({ where: { key: 'payment_qr_url' } });
      if (existing && existing.value && existing.value.startsWith('/uploads/')) {
        const oldPath = path.join(uploadDir, path.basename(existing.value));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Upsert the new QR URL
      const setting = await prisma.appSettings.upsert({
        where: { key: 'payment_qr_url' },
        update: { value: relativePath },
        create: { key: 'payment_qr_url', value: relativePath },
      });

      return res.json({
        message: 'Payment QR code uploaded and updated successfully.',
        qrUrl: relativePath,
        setting,
      });
    } catch (error: any) {
      console.error('[QR Upload Error]', error);
      return res.status(500).json({ message: 'Failed to upload QR code.' });
    }
  }
);

export default router;
