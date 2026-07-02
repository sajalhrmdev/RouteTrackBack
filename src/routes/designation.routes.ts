import { Router } from 'express';
import { getAll, getById, create, update, remove } from '../controllers/designation.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../validations';
import { createDesignationSchema, updateDesignationSchema } from '../validations/designation';

const router = Router();

router.use(authenticate);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', authorize('COMPANY_ADMIN'), validate(createDesignationSchema), create);
router.put('/:id', authorize('COMPANY_ADMIN'), validate(updateDesignationSchema), update);
router.delete('/:id', authorize('COMPANY_ADMIN'), remove);

export default router;
