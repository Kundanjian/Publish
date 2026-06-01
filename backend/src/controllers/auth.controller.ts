import { UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { sendRegistrationOtp } from '../services/email.service';
import { signAccessToken } from '../utils/jwt';
import { generateOtpCode, isExpired } from '../utils/otp';
import { hashPassword, verifyPassword } from '../utils/password';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const registerRequestSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6)
});

const verifyRegisterSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().length(6)
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6)
});

const isDatabaseConnectionError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.name === 'PrismaClientInitializationError' ||
      error.message.includes('Authentication failed against database server') ||
      error.message.includes("Can't reach database server"))
  );
};

const isDevelopmentFallbackEnabled = () => env.NODE_ENV !== 'production';

const buildDevelopmentUser = (email: string, requiredRole: UserRole) => {
  const isSeedAdmin =
    requiredRole === UserRole.ADMIN && email.toLowerCase() === env.ADMIN_SEED_EMAIL.toLowerCase();
  const name = isSeedAdmin
    ? env.ADMIN_SEED_NAME
    : email
        .split('@')[0]
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ') || 'Demo User';

  return {
    id: `dev-${requiredRole.toLowerCase()}-${Buffer.from(email).toString('base64url')}`,
    email,
    name,
    role: requiredRole
  };
};

const buildTokenResponse = (user: { id: string; email: string; name: string; role: UserRole }) => {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  };
};

export const requestRegistrationOtp = async (req: Request, res: Response) => {
  const parsed = registerRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
  }

  const { name, email, password, confirmPassword } = parsed.data;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Password and confirm password must match' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists. Please login.' });
  }

  const otpCode = generateOtpCode();
  const passwordHash = await hashPassword(password);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  await prisma.registrationOtp.deleteMany({ where: { email } });

  await prisma.registrationOtp.create({
    data: {
      email,
      name,
      passwordHash,
      otpCode,
      expiresAt
    }
  });

  await sendRegistrationOtp(email, otpCode, env.OTP_TTL_MINUTES);

  return res.status(200).json({
    message: 'OTP sent to your email.',
    email
  });
};

export const verifyRegistrationOtp = async (req: Request, res: Response) => {
  const parsed = verifyRegisterSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
  }

  const { email, otp } = parsed.data;

  const otpRecord = await prisma.registrationOtp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' }
  });

  if (!otpRecord) {
    return res.status(400).json({ message: 'No OTP request found for this email.' });
  }

  if (otpRecord.attempts >= 5) {
    return res.status(429).json({ message: 'Too many wrong OTP attempts. Please request a new OTP.' });
  }

  if (isExpired(otpRecord.expiresAt)) {
    await prisma.registrationOtp.deleteMany({ where: { email } });
    return res.status(400).json({ message: 'OTP expired. Please request a new OTP.' });
  }

  if (otpRecord.otpCode !== otp) {
    await prisma.registrationOtp.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } }
    });
    return res.status(400).json({ message: 'Invalid OTP.' });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    await prisma.registrationOtp.deleteMany({ where: { email } });
    return res.status(409).json({ message: 'User already exists. Please login.' });
  }

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: otpRecord.name,
        email: otpRecord.email,
        passwordHash: otpRecord.passwordHash,
        role: UserRole.USER,
        emailVerifiedAt: new Date()
      }
    });

    await tx.registrationOtp.deleteMany({ where: { email } });
    return user;
  });

  return res.status(201).json({
    message: 'Registration completed successfully.',
    ...buildTokenResponse(createdUser)
  });
};

const loginByRole = async (req: Request, res: Response, requiredRole: UserRole) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;

  let user;

  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (error) {
    if (isDatabaseConnectionError(error) && isDevelopmentFallbackEnabled()) {
      const fallbackUser = buildDevelopmentUser(email, requiredRole);

      return res.status(200).json({
        message:
          'Login successful using development fallback because database credentials are not valid.',
        databaseWarning:
          'Fix backend/.env DATABASE_URL to enable real user accounts and persistent sessions.',
        ...buildTokenResponse(fallbackUser)
      });
    }

    throw error;
  }

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (requiredRole === UserRole.USER && user.role !== UserRole.USER) {
    return res.status(403).json({ message: 'Admin account cannot login from /login' });
  }

  if (requiredRole === UserRole.ADMIN && user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: 'Only admin account can login from /admin-login' });
  }

  return res.status(200).json({
    message: 'Login successful',
    ...buildTokenResponse(user)
  });
};

export const loginUser = (req: Request, res: Response) => loginByRole(req, res, UserRole.USER);

export const loginAdmin = (req: Request, res: Response) => loginByRole(req, res, UserRole.ADMIN);

export const logout = async (_req: Request, res: Response) => {
  return res.status(200).json({ message: 'Logged out successfully' });
};

export const getMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  let user;

  try {
    user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
  } catch (error) {
    if (isDatabaseConnectionError(error) && isDevelopmentFallbackEnabled()) {
      return res.status(200).json({ user: req.user });
    }

    throw error;
  }

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json({ user });
};
