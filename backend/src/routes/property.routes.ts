import { Router } from 'express';
import {
  createProperty,
  getPropertyById,
  listMyProperties,
  listProperties
} from '../controllers/property.controller';
import { asyncHandler } from '../middleware/async-handler.middleware';
import { requireAuth } from '../middleware/auth.middleware';

export const propertyRouter = Router();

propertyRouter.get('/', asyncHandler(listProperties));
propertyRouter.get('/mine', requireAuth, asyncHandler(listMyProperties));
propertyRouter.post('/', requireAuth, asyncHandler(createProperty));
propertyRouter.get('/:id', asyncHandler(getPropertyById));
