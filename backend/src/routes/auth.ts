import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db';

const router = Router();

// ─── SECURITY C6: Require real secrets in production ─────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const DEV_SECRETS = [
  'dev_jwt_secret_change_in_production',
  'dev_jwt_refresh_secret_change_in_production',
  '',
  undefined,
];

const isProduction = process.env.NODE_ENV === 'production';

if (!JWT_SECRET || (isProduction && DEV_SECRETS.includes(JWT_SECRET))) {
  const msg = 'FATAL: JWT_SECRET is not set or is still the dev placeholder. Set a strong random secret in production .env';
  if (isProduction) { console.error(msg); process.exit(1); }
  else console.warn('[DEV WARNING] JWT_SECRET is using a dev placeholder. Change before going to production.');
}

if (!JWT_REFRESH_SECRET || (isProduction && DEV_SECRETS.includes(JWT_REFRESH_SECRET))) {
  const msg = 'FATAL: JWT_REFRESH_SECRET is not set or is still the dev placeholder. Set a strong random secret in production .env';
  if (isProduction) { console.error(msg); process.exit(1); }
  else console.warn('[DEV WARNING] JWT_REFRESH_SECRET is using a dev placeholder. Change before going to production.');
}

// OTP store: phoneNumber -> { code, expiresAt, attempts }
const mockOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const generateReferralCode = () => {
  return 'MERO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ─── SECURITY: Tokens always signed with verified secrets ─────────────────────
const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET!,
    { expiresIn: '1d' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// ─── SECURITY: Server-side password strength validation ───────────────────────
const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  return null;
};

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, phoneNumber, firstName, lastName, referralCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // ─── SECURITY C2: Enforce password strength ────────────────────────────
    const pwError = validatePassword(password);
    if (pwError) {
      return res.status(400).json({ message: pwError });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email address format.' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber: phoneNumber || undefined }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or phone number already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12); // increased from 10 to 12
    const newRefCode = generateReferralCode();

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          phoneNumber,
          // ─── SECURITY C1: Role NEVER derived from email ──────────────────
          role: 'USER',
          profile: {
            create: {
              firstName: firstName || '',
              lastName: lastName || '',
              referralCode: newRefCode,
              welcomeBonusClaimed: true,
            },
          },
        },
      });

      if (referralCode) {
        const referrerProfile = await tx.profile.findUnique({
          where: { referralCode },
        });

        if (referrerProfile) {
          await tx.referral.create({
            data: {
              referrerId: referrerProfile.userId,
              refereeId: u.id,
              bonusStatus: 'GRANTED',
            },
          });

          await tx.notification.create({
            data: {
              userId: referrerProfile.userId,
              message: `Congratulations! Someone joined using your referral link. You've earned a referral bonus check.`,
            },
          });
        }
      }

      await tx.notification.create({
        data: {
          userId: u.id,
          message: 'Welcome to Mero Luck! A ₹100 Welcome Bonus has been credited to your rewards.',
        },
      });

      return u;
    });

    const tokens = generateTokens(user);
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error: any) {
    console.error('[Register Error]', error);
    // ─── SECURITY M1: Never leak internal error details ────────────────────
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // ─── SECURITY: Constant-time comparison even if user doesn't exist ─────
    const dummyHash = '$2a$12$invalidhashfortimingprotection000000000000000000000000';
    const validPassword = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const tokens = generateTokens(user);
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error: any) {
    console.error('[Login Error]', error);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// Refresh Token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET!) as { id: string; email: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const tokens = generateTokens(user);
    return res.json(tokens);
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
});

// Request OTP Verification
router.post('/otp/send', async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min

  // ─── SECURITY H5: Reset attempts on resend ────────────────────────────────
  mockOtpStore.set(phoneNumber, { code, expiresAt, attempts: 0 });

  // ─── SECURITY C2: OTP is NEVER returned in the HTTP response ─────────────
  // In production: integrate an SMS provider (Twilio, Sparrow SMS, etc.)
  console.log(`[OTP] Code for ${phoneNumber}: ${code}`); // server-side only

  return res.json({
    message: 'OTP sent successfully. Please check your SMS.',
  });
});

// Verify OTP
router.post('/otp/verify', async (req: Request, res: Response) => {
  const { phoneNumber, code } = req.body;
  if (!phoneNumber || !code) {
    return res.status(400).json({ message: 'Phone number and OTP code are required' });
  }

  const stored = mockOtpStore.get(phoneNumber);
  if (!stored) {
    return res.status(400).json({ message: 'No active OTP request found for this number. Please request a new OTP.' });
  }

  // ─── SECURITY H5: OTP attempt limit ──────────────────────────────────────
  if (stored.attempts >= 5) {
    mockOtpStore.delete(phoneNumber);
    return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
  }

  if (Date.now() > stored.expiresAt) {
    mockOtpStore.delete(phoneNumber);
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }

  if (stored.code !== code) {
    // Increment attempt counter
    mockOtpStore.set(phoneNumber, { ...stored, attempts: stored.attempts + 1 });
    const remaining = 5 - (stored.attempts + 1);
    return res.status(400).json({ message: `Incorrect verification code. ${remaining} attempt(s) remaining.` });
  }

  mockOtpStore.delete(phoneNumber);

  const user = await prisma.user.findUnique({ where: { phoneNumber } });
  if (user) {
    await prisma.profile.update({
      where: { userId: user.id },
      data: { kycStatus: 'APPROVED' },
    });
  }

  return res.json({ message: 'OTP verified successfully!' });
});

// ─── SECURITY C3: Google OAuth disabled until properly implemented ─────────────
// The mock implementation accepts any email without verifying the Google token,
// which is a critical authentication bypass vulnerability.
// To enable: install firebase-admin or google-auth-library, verify the idToken,
// then create/update the user safely.
router.post('/google-login', async (req: Request, res: Response) => {
  return res.status(503).json({
    message: 'Google OAuth is not yet configured for production. Please use email/password login.',
  });
});

export default router;
