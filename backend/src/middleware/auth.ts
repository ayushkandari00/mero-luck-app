import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ─── SECURITY C6: No hardcoded fallback secrets ─────────────────────────────
// auth.ts startup guard ensures these are set. These are read here for token
// verification only — they will always be defined by the time routes run.
const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  headers: any;
  body: any;
  params: any;
  file?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user as AuthRequest['user'];
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // ─── SECURITY C1: Role checked from verified JWT payload, not from email ──
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
  next();
};
