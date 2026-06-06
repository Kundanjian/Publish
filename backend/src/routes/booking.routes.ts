import { Router } from 'express';
import { createBooking, listBookings } from '../controllers/booking.controller';
import { asyncHandler } from '../middleware/async-handler.middleware';
import { requireAuth } from '../middleware/auth.middleware';

export const bookingRouter = Router();

bookingRouter.get('/', requireAuth, asyncHandler(listBookings));
bookingRouter.post('/', requireAuth, asyncHandler(createBooking));
