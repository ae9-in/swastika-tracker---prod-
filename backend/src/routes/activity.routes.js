import { Router } from 'express';
import { authenticate, requireBusiness } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { activityValidation, getList } from '../controllers/activity.controller.js';

const router = Router();

router.use(authenticate, requireBusiness);
router.get('/', validate(activityValidation.listSchema), getList);

export default router;
