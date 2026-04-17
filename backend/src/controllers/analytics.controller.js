import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDashboardMetrics } from '../services/analytics.service.js';

const metricsSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    rangeDays: z.coerce.number().optional(),
  }),
});

export const analyticsValidation = { metricsSchema };

export const metrics = asyncHandler(async (req, res) => {
  const payload = await getDashboardMetrics(req.validated.query, req.auth);
  res.json(payload);
});
