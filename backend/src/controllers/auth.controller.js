import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getMe, loginUser, registerUser, selectBusiness, savePushSubscription, listEmployeesForBusiness } from '../services/auth.service.js';
import { listBusinessesForUser } from '../services/business.service.js';

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
  }),
  query: z.any(),
  params: z.any(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  query: z.any(),
  params: z.any(),
});

const selectBusinessSchema = z.object({
  body: z.object({
    businessId: z.string().min(1),
  }),
  query: z.any(),
  params: z.any(),
});

const pushSubscribeSchema = z.object({
  body: z.object({
    subscription: z.object({
      endpoint: z.string(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
    }),
  }),
  query: z.any(),
  params: z.any(),
});

export const authValidation = {
  registerSchema,
  loginSchema,
  selectBusinessSchema,
  pushSubscribeSchema,
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;
  const result = await registerUser(name, email, password);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const result = await loginUser(email, password);
  res.json(result);
});

export const switchBusiness = asyncHandler(async (req, res) => {
  const { businessId } = req.validated.body;
  const result = await selectBusiness(req.auth.sub, businessId);
  res.json(result);
});

export const me = asyncHandler(async (req, res) => {
  const payload = await getMe(req.auth.sub, req.auth.activeBusinessId || null);
  res.json(payload);
});

export const myBusinesses = asyncHandler(async (req, res) => {
  const businesses = await listBusinessesForUser(req.auth.sub);
  res.json({ data: businesses });
});

export const subscribePush = asyncHandler(async (req, res) => {
  const { subscription } = req.validated.body;
  const result = await savePushSubscription(req.auth.sub, subscription);
  res.json(result);
});

export const listEmployees = asyncHandler(async (req, res) => {
  const businessId = req.auth.activeBusinessId;
  if (!businessId) {
    return res.status(400).json({ message: 'No active business selected' });
  }
  const employees = await listEmployeesForBusiness(businessId);
  res.json({ data: employees });
});
