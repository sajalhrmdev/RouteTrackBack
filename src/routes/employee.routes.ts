import { Router } from 'express';
import { getAll, getById, create, update, remove, getStats } from '../controllers/employee.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../validations';
import { createEmployeeSchema, updateEmployeeSchema } from '../validations/employee';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/me', getById);
router.get('/stats', getStats);
router.get('/:id', getById);
router.post('/', authorize('COMPANY_ADMIN', 'MANAGER'), validate(createEmployeeSchema), create);
router.put('/:id', authorize('COMPANY_ADMIN', 'MANAGER'), validate(updateEmployeeSchema), update);
router.delete('/:id', authorize('COMPANY_ADMIN'), remove);

export default router;
