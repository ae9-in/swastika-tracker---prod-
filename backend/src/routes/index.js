import { Router } from 'express';
import authRoutes from './auth.routes.js';
import affiliateRoutes from './affiliate.routes.js';
import reminderRoutes from './reminder.routes.js';
import activityRoutes from './activity.routes.js';
import analyticsRoutes from './analytics.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/affiliates', affiliateRoutes);
router.use('/reminders', reminderRoutes);
router.use('/activities', activityRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
