import { Response } from 'express';
import { z } from 'zod';
import {
  bookings,
  calculateRentalAmount,
  hasDateConflict,
  marketplaceProperties
} from '../data/marketplace.store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const bookingSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  tenantName: z.string().trim().min(2),
  tenantEmail: z.string().trim().email(),
  startDate: z.string().trim().min(10),
  endDate: z.string().trim().min(10)
});

export const listBookings = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const scopedBookings =
    req.user.role === 'ADMIN'
      ? bookings
      : bookings.filter((booking) => booking.tenantEmail.toLowerCase() === req.user?.email.toLowerCase());

  return res.status(200).json(scopedBookings);
};

export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const parsed = bookingSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid booking details' });
  }

  const { propertyId, startDate, endDate } = parsed.data;
  const property = marketplaceProperties.find((item) => item.id === propertyId);

  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / 86_400_000) + 1;

  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    return res.status(400).json({ message: 'End date must be after start date' });
  }

  if (hasDateConflict(property.bookedRanges, startDate, endDate)) {
    return res.status(409).json({ message: 'Property is already booked for selected dates' });
  }

  const bookingNumber = bookings.length + 1001;
  const booking = {
    id: `BK-${bookingNumber}`,
    propertyId,
    propertyTitle: property.title,
    tenantName: req.user.name,
    tenantEmail: req.user.email,
    startDate,
    endDate,
    durationDays,
    amount: calculateRentalAmount(property, durationDays),
    status: 'CONFIRMED' as const,
    paymentStatus: 'PAID' as const,
    invoiceNo: `INV-2026-${bookingNumber}`,
    landlordContact: {
      name: property.ownerName,
      phone: property.ownerPhone,
      email: property.ownerEmail
    },
    createdAt: new Date().toISOString()
  };

  bookings.unshift(booking);
  property.bookedRanges.push({ from: startDate, to: endDate, bookingId: booking.id });
  property.status = 'BOOKED';

  return res.status(201).json({
    message: 'Payment captured and booking confirmed',
    booking
  });
};
