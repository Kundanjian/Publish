import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendEnquiryNotificationToAdmin, sendEnquiryApprovedToLister } from '../services/email.service';
import { marketplaceProperties } from '../data/marketplace.store';

const enquirySchema = z.object({
  propertyId: z.string().min(1),
  enquiryType: z.enum(['rent', 'bike', 'room', 'flat', 'house', 'other']),
  message: z.string().trim().min(10).max(1000),
  preferredContact: z.enum(['email', 'phone', 'whatsapp']).default('email'),
  moveInDate: z.string().optional(),
  duration: z.string().optional(),
  budget: z.string().optional(),
});

/**
 * POST /api/enquiries
 * Authenticated user submits an enquiry for a listing.
 * Admin receives notification. Lister details are NOT sent to the user.
 */
export const createEnquiry = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Login to send an enquiry.' });
  }

  const parsed = enquirySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid enquiry details', errors: parsed.error.flatten() });
  }

  const { propertyId, enquiryType, message, preferredContact, moveInDate, duration, budget } = parsed.data;

  // Look up the property (check DB first, then in-memory store)
  let propertyTitle = 'a rental listing';
  let propertyLocation = '';
  let listerEmail: string | null = null;
  let listerName = 'the owner';

  try {
    // Try DB-backed property
    const dbProperty = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { landlord: { select: { name: true, email: true } } }
    });

    if (dbProperty) {
      propertyTitle = dbProperty.title;
      propertyLocation = dbProperty.location;
      listerEmail = dbProperty.landlord.email;
      listerName = dbProperty.landlord.name;
    }
  } catch {
    // DB unavailable — try in-memory store
  }

  // Fall back to marketplace store if DB lookup failed
  if (!listerEmail) {
    const memProp = marketplaceProperties.find((p) => String(p.id) === propertyId);
    if (memProp) {
      propertyTitle = memProp.title;
      propertyLocation = memProp.location;
      listerEmail = memProp.ownerEmail;
      listerName = memProp.ownerName;
    }
  }

  if (!listerEmail) {
    return res.status(404).json({ message: 'Property not found.' });
  }

  // Save enquiry to DB
  let enquiryId = `ENQ-${Date.now()}`;
  try {
    const saved = await prisma.enquiry.create({
      data: {
        propertyId,
        userId: req.user.id,
        enquiryType,
        message,
        preferredContact,
        moveInDate: moveInDate || null,
        duration: duration || null,
        budget: budget || null,
        status: 'PENDING',
        listerEmail,
      }
    });
    enquiryId = saved.id;
  } catch {
    // DB unavailable — proceed without persisting (graceful degradation)
  }

  // Notify Unio admin
  await sendEnquiryNotificationToAdmin({
    enquiryId,
    propertyId,
    propertyTitle,
    propertyLocation,
    listerEmail,
    listerName,
    enquiryType,
    message,
    preferredContact,
    moveInDate,
    duration,
    budget,
    userName: req.user.name,
    userEmail: req.user.email,
    userPhone: req.user.phone || undefined,
  }).catch(() => { /* email failure is non-fatal */ });

  return res.status(201).json({
    message: 'Enquiry received! Our team will review it and get back to you shortly.',
    enquiryId,
  });
};

/**
 * GET /api/enquiries — Admin: list all enquiries. User: list own enquiries.
 */
export const listEnquiries = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const enquiries = await prisma.enquiry.findMany({
      where: req.user.role === 'ADMIN' ? {} : { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true, email: true, phone: true } },
      }
    });
    return res.status(200).json(enquiries);
  } catch {
    return res.status(200).json([]);
  }
};

/**
 * PATCH /api/enquiries/:id/approve — Admin approves an enquiry → sends notification to lister.
 * Lister receives: "You have a new potential lead" — NO user contact details.
 */
export const approveEnquiry = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  const { id } = req.params;

  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
      include: { user: { select: { name: true } } }
    });

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found.' });
    }

    if (enquiry.status !== 'PENDING') {
      return res.status(409).json({ message: `Enquiry is already ${enquiry.status.toLowerCase()}.` });
    }

    await prisma.enquiry.update({ where: { id }, data: { status: 'APPROVED' } });

    // Send lead notification to lister — deliberately no user contact details
    await sendEnquiryApprovedToLister({
      enquiryId: id,
      propertyId: enquiry.propertyId,
      listerEmail: enquiry.listerEmail,
      enquiryType: enquiry.enquiryType,
      moveInDate: enquiry.moveInDate || undefined,
      duration: enquiry.duration || undefined,
      budget: enquiry.budget || undefined,
    }).catch(() => { /* email failure is non-fatal */ });

    return res.status(200).json({ message: 'Enquiry approved. Lister has been notified.' });
  } catch {
    return res.status(500).json({ message: 'Unable to process approval right now.' });
  }
};

/**
 * PATCH /api/enquiries/:id/reject — Admin rejects an enquiry.
 */
export const rejectEnquiry = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  const { id } = req.params;
  const reason = String(req.body.reason || '').trim() || 'Does not meet listing criteria.';

  try {
    const enquiry = await prisma.enquiry.findUnique({ where: { id } });
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' });

    await prisma.enquiry.update({ where: { id }, data: { status: 'REJECTED', rejectionReason: reason } });
    return res.status(200).json({ message: 'Enquiry rejected.' });
  } catch {
    return res.status(500).json({ message: 'Unable to reject enquiry right now.' });
  }
};
