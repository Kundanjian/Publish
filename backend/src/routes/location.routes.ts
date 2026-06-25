import { Router } from 'express';
import { suggestLocations } from '../controllers/location.controller';
import { asyncHandler } from '../middleware/async-handler.middleware';

export const locationRouter = Router();

locationRouter.get('/suggest', asyncHandler(suggestLocations));
