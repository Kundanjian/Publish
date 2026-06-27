import { Response } from 'express';
import { prisma } from '../config/prisma';
import { bookings, marketplaceProperties } from '../data/marketplace.store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const adminDashboard = async (req: AuthenticatedRequest, res: Response) => {
  let totalUsers = 0;
  let totalAdmins = 0;

  try {
    totalUsers = await prisma.user.count();
    totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
  } catch (error) {
    if (
      !(error instanceof Error) ||
      (!error.message.includes('Authentication failed against database server') &&
        !error.message.includes("Can't reach database server"))
    ) {
      throw error;
    }
  }

  return res.status(200).json({
    message: 'Admin dashboard data',
    user: req.user,
    stats: {
      totalUsers,
      totalAdmins,
      totalProperties: marketplaceProperties.length,
      pendingProperties: marketplaceProperties.filter((item) => item.status === 'PENDING_APPROVAL').length,
      confirmedBookings: bookings.filter((item) => item.status === 'CONFIRMED').length,
      paidRevenue: bookings
        .filter((item) => item.paymentStatus === 'PAID')
        .reduce((total, item) => total + item.amount, 0)
    }
  });
};
