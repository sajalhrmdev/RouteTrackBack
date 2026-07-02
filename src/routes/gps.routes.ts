import { Router } from 'express';
import { recordLocation, recordBatch, getRouteHistory, getLastLocation } from '../controllers/gps.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../validations';
import { gpsLocationSchema, gpsBatchSchema } from '../validations/attendance';
import { gpsRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);

router.post('/location', gpsRateLimiter, validate(gpsLocationSchema), recordLocation);
router.post('/batch', gpsRateLimiter, validate(gpsBatchSchema), recordBatch);
router.get('/history/:employeeId', getRouteHistory);
router.get('/last/:employeeId', getLastLocation);

export default router;
