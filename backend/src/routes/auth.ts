import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretmerolucktoken123!';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecretmeroluckrefreshtoken123!';

// Simple mock OTP storage in memory (phone number -> OTP code)
const mockOtpStore = new Map<string, { code: string; expiresAt: number }>();

// Generate a random referral code
const generateReferralCode = () => {
  return 'MERO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Generate access & refresh tokens
const generateTokens = (user: { id: string; email: string; role: string }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, phoneNumber, firstName, lastName, referralCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber: phoneNumber || undefined }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or phone number already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newRefCode = generateReferralCode();

    // Start a transaction to create user, profile and welcome bonus
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email,
          passwordHash,
          phoneNumber,
          role: email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER',
          profile: {
            create: {
              firstName: firstName || '',
              lastName: lastName || '',
              referralCode: newRefCode,
              welcomeBonusClaimed: true, // Welcome bonus granted automatically
            },
          },
        },
      });

      // Handle referral code signup if provided
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

          // Create standard welcome notifications for both
          await tx.notification.create({
            data: {
              userId: referrerProfile.userId,
              message: `Congratulations! Someone joined using your referral link. You've earned a referral bonus check.`,
            },
          });
        }
      }

      // Welcome notifications
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
    console.error(error);
    return res.status(500).json({ message: 'Registration failed', error: error.message });
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
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
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
    console.error(error);
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Refresh Token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string; email: string; role: string };
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

// Request OTP Verification (simulated)
router.post('/otp/send', async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  // Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min expiry

  mockOtpStore.set(phoneNumber, { code, expiresAt });

  console.log(`[MOCK OTP] Verification code for ${phoneNumber} is: ${code}`);

  return res.json({
    message: 'OTP sent successfully (Simulated)',
    // In production we would not send this back in the response, but for testing convenience let's provide it or log it
    otp: code, 
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
    return res.status(400).json({ message: 'No active OTP verification request found for this number' });
  }

  if (Date.now() > stored.expiresAt) {
    mockOtpStore.delete(phoneNumber);
    return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
  }

  if (stored.code !== code) {
    return res.status(400).json({ message: 'Incorrect verification code' });
  }

  mockOtpStore.delete(phoneNumber);

  // If a user has this phone number, we can mark their profile KYC or verification as updated
  const user = await prisma.user.findUnique({ where: { phoneNumber } });
  if (user) {
    await prisma.profile.update({
      where: { userId: user.id },
      data: { kycStatus: 'APPROVED' },
    });
  }

  return res.json({ message: 'OTP verified successfully!' });
});

// Mock Google OAuth login
router.post('/google-login', async (req: Request, res: Response) => {
  const { email, name, googleToken } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = await bcrypt.hash(uuidv4(), 10);
      const newRefCode = generateReferralCode();
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER',
          profile: {
            create: {
              firstName: name?.split(' ')[0] || '',
              lastName: name?.split(' ')[1] || '',
              referralCode: newRefCode,
              welcomeBonusClaimed: true,
            },
          },
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          message: 'Welcome to Mero Luck! Signed in via Google. A ₹100 Welcome Bonus is yours.',
        },
      });
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
    return res.status(500).json({ message: 'Google authentication failed', error: error.message });
  }
});

export default router;
