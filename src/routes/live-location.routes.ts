import { Router } from 'express';
import { getActiveLocations } from '../controllers/live-location.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(Role.COMPANY_ADMIN, Role.MANAGER, Role.SUPER_ADMIN),
  getActiveLocations
);

export default router;
