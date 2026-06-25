import { Router } from 'express';
import { getMobileAppMeta } from '../controllers/meta.controller';
import { asyncHandler } from '../middleware/async-handler.middleware';

export const metaRouter = Router();

metaRouter.get('/mobile-app', asyncHandler(getMobileAppMeta));
