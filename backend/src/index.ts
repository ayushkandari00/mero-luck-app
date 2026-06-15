import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Configure dotenv
dotenv.config();

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import purchaseRoutes from './routes/purchases';
import drawRoutes from './routes/draws';
import adminRoutes from './routes/admin';
import numberedCoinRoutes from './routes/numbered-coins';
import { authenticateToken, AuthRequest } from './middleware/auth';
import prisma from './db';

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

// ─── SECURITY M5: Security headers ───────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
}));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
  },
});

// ─── SECURITY H1: Rate Limiting ───────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute
  max: 100,                  // 100 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                   // 10 auth attempts per IP per 15 min
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,                    // 5 OTP sends per IP per 15 min
  message: { message: 'Too many OTP requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply global rate limit
app.use(globalLimiter);

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// ─── SECURITY C5: NO public static uploads serve ─────────────────────────────
// Removed: app.use('/uploads', express.static(...))
// Uploads are now served via authenticated endpoint below.

// ─── Routes ──────────────────────────────────────────────────────────────────
// Apply stricter rate limits to sensitive auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/otp/send', otpLimiter);
app.use('/api/auth/otp/verify', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/numbered-coins', numberedCoinRoutes);

// ─── SECURITY C5: Authenticated upload serving ───────────────────────────────
// Only admin or the owner of the transaction can view payment proof files.
const uploadDir = path.join(__dirname, '../uploads');
app.get('/api/uploads/:filename', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;

    // ─── SECURITY: Path traversal prevention ─────────────────────────────────
    const safeName = path.basename(filename);
    const fullPath = path.join(uploadDir, safeName);

    if (!fullPath.startsWith(uploadDir)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Admins can view any file
    if (req.user?.role === 'ADMIN') {
      return res.sendFile(fullPath);
    }

    // Regular users can only access their own payment proof files
    const transaction = await prisma.transaction.findFirst({
      where: {
        userId: req.user?.id,
        paymentProofUrl: `/uploads/${safeName}`,
      },
    });

    if (!transaction) {
      return res.status(403).json({ message: 'Access denied. You do not own this file.' });
    }

    return res.sendFile(fullPath);
  } catch (err: any) {
    console.error('[Upload Serve Error]', err);
    return res.status(500).json({ message: 'Failed to retrieve file.' });
  }
});

// Health check (no sensitive info)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler — never leak stack traces
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ message: 'An unexpected error occurred.' });
});

// Socket connection
io.on('connection', (socket) => {
  socket.join('live-ticker');
  socket.on('disconnect', () => {});
});

// Simulated live activity (development/demo mode only)
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const luckyNumbers = ['149230', '568794', '204938', '993410', '481230', '823491'];
    const mockNames = ['Aayush S.', 'Bibek K.', 'Sandip T.', 'Priyanka D.', 'Niranjan R.'];
    const mockActivity = {
      user: mockNames[Math.floor(Math.random() * mockNames.length)],
      number: luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)],
      type: Math.random() > 0.4 ? 'token' : 'coin',
      timestamp: new Date(),
    };
    io.to('live-ticker').emit('new-purchase-activity', mockActivity);
  }, 12000);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Mero Luck Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
