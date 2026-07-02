import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import attendanceRoutes from './attendance.routes';
import gpsRoutes from './gps.routes';
import departmentRoutes from './department.routes';
import designationRoutes from './designation.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import liveLocationRoutes from './live-location.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/gps', gpsRoutes);
router.use('/departments', departmentRoutes);
router.use('/designations', designationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/live-locations', liveLocationRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
