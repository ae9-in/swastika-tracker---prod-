import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { listActivities } from '../services/activity.service.js';

const listSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    limit: z.coerce.number().optional(),
  }),
});

export const activityValidation = { listSchema };

export const getList = asyncHandler(async (req, res) => {
  const payload = await listActivities(req.validated.query, req.auth);
  res.json(payload);
});
