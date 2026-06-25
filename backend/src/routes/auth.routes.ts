import { Router } from 'express';
import {
  getMyProfile,
  loginAdmin,
  loginUser,
  logout,
  requestRegistrationOtp,
  verifyRegistrationOtp
} from '../controllers/auth.controller';
import { asyncHandler } from '../middleware/async-handler.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rate-limit.middleware';

export const authRouter = Router();

authRouter.post('/register/request-otp', authLimiter, asyncHandler(requestRegistrationOtp));
authRouter.post('/register/verify-otp', authLimiter, asyncHandler(verifyRegistrationOtp));
authRouter.post('/login', authLimiter, asyncHandler(loginUser));
authRouter.post('/admin-login', authLimiter, asyncHandler(loginAdmin));
authRouter.post('/logout', requireAuth, asyncHandler(logout));
authRouter.get('/me', requireAuth, asyncHandler(getMyProfile));
