import { Request, Response } from 'express';
import { z } from 'zod';
import { marketplaceProperties } from '../data/marketplace.store';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const propertySchema = z.object({
  title: z.string().trim().min(3),
  location: z.string().trim().min(3),
  price: z.coerce.number().positive(),
  dailyPrice: z.coerce.number().positive(),
  propertyType: z.string().trim().min(3),
  ownerName: z.string().trim().min(2),
  ownerPhone: z.string().trim().min(8),
  ownerEmail: z.string().trim().email(),
  summary: z.string().trim().min(10).optional(),
  images: z.array(z.string().startsWith('data:image/')).max(8).default([]),
  specifications: z.array(z.string().trim().min(1)).default([]),
  addOns: z
    .array(
      z.object({
        name: z.string().trim().min(2),
        charge: z.coerce.number().nonnegative(),
        image: z.string().startsWith('data:image/').optional()
      })
    )
    .default([]),
  nearbyLandmark: z.string().trim().optional().default(''),
  landmarkDistance: z.string().trim().optional().default(''),
  foodAvailable: z.coerce.boolean().default(false),
  foodOptions: z.array(z.string().trim().min(1)).default([]),
  entryRule: z.string().trim().optional().default('24 hour entry allowed')
});

export const listProperties = async (_req: Request, res: Response) => {
  const location = String(_req.query.location || '').trim();
  const query = String(_req.query.query || '').trim();
  const normalizedLocation = normalize(location);
  const normalizedQuery = normalize(query);

  const properties = marketplaceProperties.filter((property) => {
    const locationMatch =
      !normalizedLocation ||
      normalize(property.location).includes(normalizedLocation) ||
      normalizedLocation.includes(normalize(property.location)) ||
      normalize(property.title).includes(normalizedLocation) ||
      hasLocationOverlap(normalizedLocation, normalize(property.location));
    const queryMatch =
      !normalizedQuery ||
      normalize(property.title).includes(normalizedQuery) ||
      normalize(property.propertyType).includes(normalizedQuery) ||
      normalize(property.summary).includes(normalizedQuery) ||
      normalize(property.location).includes(normalizedQuery);

    return locationMatch && queryMatch;
  });

  return res.status(200).json(properties);
};

export const getPropertyById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ message: 'Invalid property id' });
  }

  const property = marketplaceProperties.find((item) => item.id === id);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }

  return res.status(200).json(property);
};

export const listMyProperties = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const properties = marketplaceProperties.filter(
    (property) => property.ownerEmail.toLowerCase() === req.user?.email.toLowerCase()
  );

  return res.status(200).json(properties);
};

export const createProperty = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const parsed = propertySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid property details' });
  }

  const nextId = Math.max(...marketplaceProperties.map((item) => item.id)) + 1;
  const property = {
    id: nextId,
    ...parsed.data,
    ownerName: req.user.name || parsed.data.ownerName,
    ownerEmail: req.user.email,
    weeklyPrice: Math.round(parsed.data.dailyPrice * 6),
    summary:
      parsed.data.summary ||
      `${parsed.data.propertyType} in ${parsed.data.location} submitted for quick-rent approval.`,
    status: 'AVAILABLE' as const,
    availableFrom: new Date().toISOString().slice(0, 10),
    images: parsed.data.images,
    amenities: parsed.data.specifications.length
      ? parsed.data.specifications
      : ['Owner submitted listing', 'Basic facilities available'],
    rules: [
      parsed.data.entryRule,
      parsed.data.foodAvailable ? `Food available: ${parsed.data.foodOptions.join(', ') || 'ask landlord'}` : 'Food not included',
      parsed.data.nearbyLandmark && parsed.data.landmarkDistance
        ? `${parsed.data.landmarkDistance} from ${parsed.data.nearbyLandmark}`
        : 'Distance details available from landlord'
    ],
    specifications: parsed.data.specifications,
    addOns: parsed.data.addOns,
    nearbyLandmark: parsed.data.nearbyLandmark,
    landmarkDistance: parsed.data.landmarkDistance,
    foodAvailable: parsed.data.foodAvailable,
    foodOptions: parsed.data.foodOptions,
    entryRule: parsed.data.entryRule,
    bookedRanges: []
  };

  marketplaceProperties.unshift(property);

  return res.status(201).json({
    message: 'Property published live',
    property
  });
};

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const hasLocationOverlap = (selectedLocation: string, propertyLocation: string): boolean => {
  const selectedTokens = selectedLocation.split(' ').filter((token) => token.length > 2);
  return selectedTokens.some((token) => propertyLocation.includes(token));
};
