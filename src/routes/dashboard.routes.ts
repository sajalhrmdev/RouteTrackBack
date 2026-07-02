import { Router } from 'express';
import { getDashboardStats, getAttendanceTrend, getDistanceTrend } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('COMPANY_ADMIN', 'MANAGER'));

router.get('/stats', getDashboardStats);
router.get('/attendance-trend', getAttendanceTrend);
router.get('/distance-trend', getDistanceTrend);

export default router;
