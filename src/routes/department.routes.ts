import { Router } from 'express';
import { getAll, getById, create, update, remove } from '../controllers/department.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../validations';
import { createDepartmentSchema, updateDepartmentSchema } from '../validations/department';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authorize('COMPANY_ADMIN'), validate(createDepartmentSchema), create);
router.put('/:id', authorize('COMPANY_ADMIN'), validate(updateDepartmentSchema), update);
router.delete('/:id', authorize('COMPANY_ADMIN'), remove);

export default router;
