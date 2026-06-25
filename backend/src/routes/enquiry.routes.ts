import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.middleware';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import {
  approveEnquiry,
  createEnquiry,
  listEnquiries,
  rejectEnquiry,
} from '../controllers/enquiry.controller';

export const enquiryRouter = Router();

enquiryRouter.post('/', requireAuth, asyncHandler(createEnquiry));
enquiryRouter.get('/', requireAuth, asyncHandler(listEnquiries));
enquiryRouter.patch('/:id/approve', requireAuth, requireRole('ADMIN'), asyncHandler(approveEnquiry));
enquiryRouter.patch('/:id/reject', requireAuth, requireRole('ADMIN'), asyncHandler(rejectEnquiry));
