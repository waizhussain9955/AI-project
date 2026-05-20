import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { validate } from '../middleware/validate';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { store } from '../data/simpleStore';

const router = Router();
const prisma = new PrismaClient();

// Helper to check if DB is reachable
async function isDbConnected(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// ── POST /auth/login ──────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    try {
      const dbActive = await isDbConnected();
      
      if (dbActive) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ id: user.id });

        logger.info(`🔐 User logged in via Postgres: ${email}`);

        return res.json({
          success: true,
          data: {
            token,
            refreshToken,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              phone: user.phone,
            },
          },
        });
      } else {
        // Fallback to SimpleStore
        const user = store.getUserByEmail(email);
        if (!user) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ id: user.id });

        logger.warn(`🔌 DB Offline. Fallback login for: ${email}`);

        return res.json({
          success: true,
          data: {
            token,
            refreshToken,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              phone: user.phone,
            },
          },
        });
      }
    } catch (err) {
      logger.error('Error during login:', err);
      res.status(500).json({ success: false, message: 'Internal server login error' });
    }
  }
);

// ── POST /auth/signup ─────────────────────────────────────────
router.post(
  '/signup',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('name').notEmpty(),
    body('phone').optional().isMobilePhone('any'),
  ],
  validate,
  async (req: Request, res: Response) => {
    const { email, password, name, phone } = req.body;

    try {
      const dbActive = await isDbConnected();
      const passwordHash = await bcrypt.hash(password, 10);

      if (dbActive) {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
          return res.status(409).json({ success: false, message: 'Email already exists' });
        }

        const newUser = await prisma.user.create({
          data: {
            email,
            passwordHash,
            name,
            role: 'CITIZEN',
            isVerified: false,
            phone,
          },
        });

        const token = generateToken({ id: newUser.id, email, role: 'CITIZEN' });

        logger.info(`✨ User signed up via Postgres: ${email}`);

        return res.status(201).json({
          success: true,
          message: 'Account created successfully in database.',
          data: {
            token,
            user: { id: newUser.id, email, name, role: 'CITIZEN' },
          },
        });
      } else {
        // Fallback to SimpleStore
        const existingUser = store.getUserByEmail(email);
        if (existingUser) {
          return res.status(409).json({ success: false, message: 'Email already exists' });
        }

        const newUser = {
          id: `USR-${Date.now()}`,
          email,
          passwordHash,
          name,
          role: 'CITIZEN',
          isVerified: false,
          phone,
        };

        store.addUser(newUser);

        const token = generateToken({ id: newUser.id, email, role: 'CITIZEN' });

        logger.warn(`🔌 DB Offline. Fallback signup for: ${email}`);

        return res.status(201).json({
          success: true,
          message: 'Account created in offline persistent storage.',
          data: {
            token,
            user: { id: newUser.id, email, name, role: 'CITIZEN' },
          },
        });
      }
    } catch (err) {
      logger.error('Error during signup:', err);
      res.status(500).json({ success: false, message: 'Internal server signup error' });
    }
  }
);

// ── POST /auth/verify-otp ─────────────────────────────────────
router.post('/verify-otp', [body('otp').isLength({ min: 6, max: 6 })], validate, (req: Request, res: Response) => {
  const { otp } = req.body;
  if (otp === '123456') {
    res.json({ success: true, message: 'Phone number verified' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
});

// ── POST /auth/refresh ────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const dbActive = await isDbConnected();

    if (dbActive) {
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      
      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      return res.json({ success: true, data: { token } });
    } else {
      const user = store.getUserById(decoded.id);
      if (!user) return res.status(401).json({ success: false, message: 'User not found' });
      
      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      return res.json({ success: true, data: { token } });
    }
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
});

// ── GET /auth/me ──────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response) => {
  try {
    const dbActive = await isDbConnected();
    if (dbActive) {
      const user = await prisma.user.findFirst();
      return res.json({ success: true, data: user });
    } else {
      const users = store.getUsers();
      return res.json({ success: true, data: users[0] });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch user context' });
  }
});

export default router;
