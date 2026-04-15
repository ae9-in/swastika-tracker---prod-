import { Router } from 'express';
import { authenticate, requireBusiness, authorizeRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { analyticsValidation, metrics } from '../controllers/analytics.controller.js';

const router = Router();

router.use(authenticate, requireBusiness, authorizeRole('admin'));
router.get('/affiliates', validate(analyticsValidation.metricsSchema), metrics);

export default router;
