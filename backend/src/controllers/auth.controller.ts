import { UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { sendRegistrationOtp } from '../services/email.service';
import { signAccessToken } from '../utils/jwt';
import { generateOtpCode, isExpired } from '../utils/otp';
import {
  hashPassword,
  isPasswordStrong,
  PASSWORD_POLICY_MESSAGE,
  verifyPassword
} from '../utils/password';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const normalizePhone = (value?: string | null): string | null => {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[^\d+]/g, '');
  return normalized.length >= 8 ? normalized : null;
};

const registerRequestSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: z.string().min(8).max(64),
  confirmPassword: z.string().min(8).max(64)
});

const verifyRegisterSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().length(6)
});

const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(1)
});

<<<<<<< HEAD
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
=======
const buildTokenResponse = (user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  unioCoins: number;
}) => {
>>>>>>> 7f9ea7109b049d12a3c0d98ac96604b20594d1a6
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
      phone: user.phone,
      unioCoins: user.unioCoins,
      role: user.role
    }
  };
};

export const requestRegistrationOtp = async (req: Request, res: Response) => {
  const parsed = registerRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
  }

  const { name, email, phone, password, confirmPassword } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const normalizedPhone = normalizePhone(phone);

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Password and confirm password must match' });
  }

  if (!isPasswordStrong(password)) {
    return res.status(400).json({ message: PASSWORD_POLICY_MESSAGE });
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });
  if (existingByEmail) {
    return res.status(409).json({ message: 'Email is already registered. Please login.' });
  }

  if (normalizedPhone) {
    const existingByPhone = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true }
    });

    if (existingByPhone) {
      return res.status(409).json({ message: 'Mobile number is already registered. Please login.' });
    }
  }

  const otpCode = generateOtpCode();
  const passwordHash = await hashPassword(password);
  const expiresAt = new Date(Date.now() + env.OTP_TTL_MINUTES * 60 * 1000);

  await prisma.registrationOtp.deleteMany({ where: { email: normalizedEmail } });

  await prisma.registrationOtp.create({
    data: {
      email: normalizedEmail,
      phone: normalizedPhone,
      name,
      passwordHash,
      otpCode,
      expiresAt
    }
  });

  try {
    await sendRegistrationOtp(normalizedEmail, otpCode, env.OTP_TTL_MINUTES);
  } catch {
    await prisma.registrationOtp.deleteMany({ where: { email: normalizedEmail } });
    return res.status(503).json({
      message: 'Unable to deliver OTP right now. Please try again in a moment.'
    });
  }

  return res.status(200).json({
    message: 'OTP sent to your email.',
    email: normalizedEmail
  });
};

export const verifyRegistrationOtp = async (req: Request, res: Response) => {
  const parsed = verifyRegisterSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
  }

  const { otp } = parsed.data;
  const email = parsed.data.email.toLowerCase();

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

  const existingByEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
  if (existingByEmail) {
    await prisma.registrationOtp.deleteMany({ where: { email } });
    return res.status(409).json({ message: 'Email is already registered. Please login.' });
  }

  if (otpRecord.phone) {
    const existingByPhone = await prisma.user.findUnique({
      where: { phone: otpRecord.phone },
      select: { id: true }
    });

    if (existingByPhone) {
      await prisma.registrationOtp.deleteMany({ where: { email } });
      return res.status(409).json({ message: 'Mobile number is already registered. Please login.' });
    }
  }

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: otpRecord.name,
        email: otpRecord.email,
        phone: otpRecord.phone,
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

  const { identifier, password } = parsed.data;
  const normalizedIdentifier = identifier.toLowerCase();
  const normalizedPhone = normalizePhone(identifier);

<<<<<<< HEAD
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

=======
  const lookupClauses: Array<{ email?: string; phone?: string }> = [{ email: normalizedIdentifier }];
  if (normalizedPhone) {
    lookupClauses.push({ phone: normalizedPhone });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: lookupClauses
    }
  });
>>>>>>> 7f9ea7109b049d12a3c0d98ac96604b20594d1a6
  if (!user) {
    return res.status(401).json({
      message: normalizedPhone
        ? 'Mobile number is not registered.'
        : 'Email is not registered.'
    });
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Wrong password.' });
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

<<<<<<< HEAD
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
=======
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      unioCoins: true,
      role: true,
      createdAt: true
    }
  });
>>>>>>> 7f9ea7109b049d12a3c0d98ac96604b20594d1a6

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json({ user });
};
