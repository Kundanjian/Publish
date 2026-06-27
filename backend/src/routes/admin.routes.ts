import { Router } from 'express';
import { adminDashboard } from '../controllers/admin.controller';
import { asyncHandler } from '../middleware/async-handler.middleware';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

export const adminRouter = Router();

adminRouter.get('/dashboard', requireAuth, requireRole('ADMIN'), asyncHandler(adminDashboard));
