import { Router } from 'express';
import { authenticate, requireBusiness } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { create, complete, getList, reminderValidation } from '../controllers/reminder.controller.js';

const router = Router();

router.use(authenticate, requireBusiness);

router.get('/', validate(reminderValidation.listSchema), getList);
router.post('/', validate(reminderValidation.createSchema), create);
router.post('/:id/complete', validate(reminderValidation.idSchema), complete);

export default router;
