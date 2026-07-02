import { Router } from 'express';
import { checkIn, checkOut, getTodayAttendance, getCheckedInEmployees, getHistory, getEmployeeToday, getStats } from '../controllers/attendance.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../validations';
import { checkInSchema, checkOutSchema } from '../validations/attendance';

const router = Router();

router.use(authenticate);

router.post('/check-in', validate(checkInSchema), checkIn);
router.post('/check-out', validate(checkOutSchema), checkOut);
router.get('/today', getTodayAttendance);
router.get('/checked-in', authorize('COMPANY_ADMIN', 'MANAGER'), getCheckedInEmployees);
router.get('/history', getHistory);
router.get('/stats', authorize('COMPANY_ADMIN', 'MANAGER'), getStats);
router.get('/employee/:employeeId/today', getEmployeeToday);

export default router;
