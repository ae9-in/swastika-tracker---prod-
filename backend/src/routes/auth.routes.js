import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate, requireBusiness } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const { authValidation } = authController;
const router = Router();

router.post('/register', validate(authValidation.registerSchema), authController.register);

router.post('/login', validate(authValidation.loginSchema), authController.login);


router.post(
    '/select-business',
    authenticate,
    validate(authValidation.selectBusinessSchema),
    authController.switchBusiness
);

router.get('/me', authenticate, authController.me);

router.get('/businesses', authenticate, authController.myBusinesses);

// List employees for a business (for follow-up assignment dropdown)
router.get('/employees', authenticate, requireBusiness, authController.listEmployees);

// New push subscription route
router.post(
    '/push-subscribe',
    authenticate,
    validate(authValidation.pushSubscribeSchema),
    authController.subscribePush
);

export default router;
