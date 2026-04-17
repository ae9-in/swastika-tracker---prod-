import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { completeReminder, createReminder, listReminders } from '../services/reminder.service.js';

const listSchema = z.object({
  params: z.any(),
  body: z.any(),
  query: z.object({
    status: z.enum(['pending', 'completed', 'all']).optional(),
  }),
});

const createSchema = z.object({
  params: z.any(),
  query: z.any(),
  body: z.object({
    affiliateId: z.string().uuid(),
    title: z.string().min(1),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    assignedTo: z.string().uuid().optional(),
  }),
});

const idSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const reminderValidation = {
  listSchema,
  createSchema,
  idSchema,
};

export const getList = asyncHandler(async (req, res) => {
  const payload = await listReminders(req.validated.query, req.auth);
  res.json(payload);
});

export const create = asyncHandler(async (req, res) => {
  const payload = await createReminder(req.validated.body, req.auth);
  res.status(201).json(payload);
});

export const complete = asyncHandler(async (req, res) => {
  const payload = await completeReminder(req.validated.params.id, req.auth);
  res.json(payload);
});
