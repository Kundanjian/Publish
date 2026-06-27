import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  hashPassword,
  isPasswordStrong,
  PASSWORD_POLICY_MESSAGE,
  verifyPassword
} from '../utils/password';

type OrderUtilityMode = 'LANDLORD' | 'RENTEE';
type OrderUtilitySectionKey = 'enquiries' | 'history' | 'requests';

type OrderUtilityItem = {
  id: string;
  status: string;
  subtitle: string;
  title: string;
  updatedAt: string;
};

type OrderUtilitySection = {
  items: OrderUtilityItem[];
  key: OrderUtilitySectionKey;
  title: string;
};

const updateProfileSchema = z
  .object({
    email: z.string().trim().email().optional(),
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(20).optional()
  })
  .refine(
    (payload) =>
      payload.email !== undefined || payload.name !== undefined || payload.phone !== undefined,
    {
      message: 'At least one field is required'
    }
  );

const updatePasswordSchema = z.object({
  confirmNewPassword: z.string().min(8).max(64),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(64)
});

const orderModeSchema = z.object({
  mode: z.enum(['LANDLORD', 'RENTEE']).optional()
});

const orderUtilitySectionsByMode: Record<OrderUtilityMode, OrderUtilitySection[]> = {
  LANDLORD: [
    {
      key: 'history',
      title: 'History',
      items: [
        {
          id: 'lh-1',
          title: 'Civil Lines Apartment',
          subtitle: 'Stay completed by Raj Verma',
          status: 'Completed',
          updatedAt: '14 Apr 2026'
        },
        {
          id: 'lh-2',
          title: 'Napier Town Studio',
          subtitle: 'Tenant moved out after weekly stay',
          status: 'Archived',
          updatedAt: '09 Apr 2026'
        }
      ]
    },
    {
      key: 'requests',
      title: 'Requests',
      items: [
        {
          id: 'lr-1',
          title: 'Move-in extension request',
          subtitle: 'Arjun Patel requested 3 extra days',
          status: 'Pending',
          updatedAt: '18 Apr 2026'
        },
        {
          id: 'lr-2',
          title: 'Early check-in request',
          subtitle: 'Neha Singh requested 8:00 AM check-in',
          status: 'Needs action',
          updatedAt: '17 Apr 2026'
        }
      ]
    },
    {
      key: 'enquiries',
      title: 'Enquiries',
      items: [
        {
          id: 'le-1',
          title: '3 BHK flat availability',
          subtitle: 'Family enquiry for monthly rental',
          status: 'New',
          updatedAt: '18 Apr 2026'
        },
        {
          id: 'le-2',
          title: 'Security deposit clarification',
          subtitle: 'Student group asked about split deposit',
          status: 'Follow up',
          updatedAt: '16 Apr 2026'
        }
      ]
    }
  ],
  RENTEE: [
    {
      key: 'history',
      title: 'History',
      items: [
        {
          id: 'rh-1',
          title: 'Ganga Jamna Boys Hostel',
          subtitle: 'Stayed for 30 days',
          status: 'Completed',
          updatedAt: '12 Apr 2026'
        },
        {
          id: 'rh-2',
          title: 'Wright Town Apartment',
          subtitle: 'Weekly booking finished',
          status: 'Completed',
          updatedAt: '29 Mar 2026'
        }
      ]
    },
    {
      key: 'requests',
      title: 'Requests',
      items: [
        {
          id: 'rr-1',
          title: 'Maintenance request',
          subtitle: 'Fan service requested for room 203',
          status: 'In progress',
          updatedAt: '18 Apr 2026'
        },
        {
          id: 'rr-2',
          title: 'Booking cancellation',
          subtitle: 'Requested cancellation for 25 Apr slot',
          status: 'Pending',
          updatedAt: '17 Apr 2026'
        }
      ]
    },
    {
      key: 'enquiries',
      title: 'Enquiries',
      items: [
        {
          id: 're-1',
          title: 'Pet-friendly options',
          subtitle: 'Asked for hostels allowing pets',
          status: 'Answered',
          updatedAt: '16 Apr 2026'
        },
        {
          id: 're-2',
          title: 'Deposit breakup',
          subtitle: 'Need clarity on refundable amount',
          status: 'Open',
          updatedAt: '15 Apr 2026'
        }
      ]
    }
  ]
};

const normalizePhone = (value: string): string | null => {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const normalized = trimmedValue.replace(/[^\d+]/g, '');
  if (normalized.length < 8 || normalized.length > 20) {
    return null;
  }

  return normalized;
};

export const userDashboard = async (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    message: 'User dashboard data',
    user: req.user
  });
};

export const updateUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const parsed = updateProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
  }

  const { email, name, phone } = parsed.data;
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { email: true, id: true, phone: true }
  });

  if (!currentUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  const updateData: Prisma.UserUpdateInput = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (email !== undefined) {
    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail !== currentUser.email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true }
      });

      if (existingByEmail) {
        return res.status(409).json({ message: 'Email is already registered.' });
      }
    }

    updateData.email = normalizedEmail;
  }

  if (phone !== undefined) {
    const normalizedPhone = normalizePhone(phone);
    if (phone.trim() && !normalizedPhone) {
      return res.status(400).json({ message: 'Please enter a valid mobile number (8-20 digits).' });
    }

    if (normalizedPhone !== currentUser.phone) {
      if (normalizedPhone) {
        const existingByPhone = await prisma.user.findUnique({
          where: { phone: normalizedPhone },
          select: { id: true }
        });

        if (existingByPhone) {
          return res.status(409).json({ message: 'Mobile number is already registered.' });
        }
      }

      updateData.phone = normalizedPhone;
    }
  }

  if (Object.keys(updateData).length === 0) {
    const unchangedUser = await prisma.user.findUnique({
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

    return res.status(200).json({ message: 'Nothing to update.', user: unchangedUser });
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
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

  return res.status(200).json({
    message: 'Profile updated successfully.',
    user: updatedUser
  });
};

export const updateUserPassword = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const parsed = updatePasswordSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.flatten() });
  }

  const { currentPassword, newPassword, confirmNewPassword } = parsed.data;

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'New password and confirm password must match.' });
  }

  if (!isPasswordStrong(newPassword)) {
    return res.status(400).json({ message: PASSWORD_POLICY_MESSAGE });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password must be different from current password.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, passwordHash: true }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isCurrentPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    return res.status(401).json({ message: 'Current password is wrong.' });
  }

  const newPasswordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { passwordHash: newPasswordHash }
  });

  return res.status(200).json({ message: 'Password updated successfully.' });
};

export const getUserOrderUtilities = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const parsed = orderModeSchema.safeParse(req.query);
  const mode = parsed.success ? (parsed.data.mode ?? 'RENTEE') : 'RENTEE';

  return res.status(200).json({
    mode,
    sections: orderUtilitySectionsByMode[mode]
  });
};
