import { Router } from 'express';
import {
  getUserOrderUtilities,
  updateUserPassword,
  updateUserProfile,
  userDashboard
} from '../controllers/user.controller';
import { asyncHandler } from '../middleware/async-handler.middleware';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

export const userRouter = Router();

userRouter.get('/dashboard', requireAuth, requireRole('USER'), asyncHandler(userDashboard));
userRouter.patch('/profile', requireAuth, asyncHandler(updateUserProfile));
userRouter.patch('/password', requireAuth, asyncHandler(updateUserPassword));
userRouter.get('/orders', requireAuth, asyncHandler(getUserOrderUtilities));
