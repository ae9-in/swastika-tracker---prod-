import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  createAffiliate,
  exportAffiliatesCsv,
  getAffiliateById,
  importAffiliatesCsv,
  importAffiliatesJson,
  listAffiliates,
  transitionStatus,
  updateAffiliate,
  deleteAffiliate,
} from '../services/affiliate.service.js';

const phoneRegex = /^\d{10}$/;

const listSchema = z.object({
  body: z.any(),
  params: z.any(),
  query: z.object({
    page: z.coerce.number().optional(),
    pageSize: z.coerce.number().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
  }),
});

const idParamSchema = z.object({
  body: z.any(),
  query: z.any(),
  params: z.object({ id: z.string().uuid() }),
});

const createSchema = z.object({
  query: z.any(),
  params: z.any(),
  body: z.object({
    name: z.string().min(1),
    product: z.string().min(1),
    address: z.string().min(1),
    phone1: z.string().regex(phoneRegex),
    phone2: z.string().regex(phoneRegex).optional().nullable(),
    location_link: z.string().optional().nullable(),
    description: z.string().min(1),
    status: z.enum(['Contacted', 'Samples Given', 'Follow Up Visit', 'Delivered']).optional(),
  }),
});

const updateSchema = z.object({
  query: z.any(),
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      name: z.string().min(1).optional(),
      product: z.string().min(1).optional(),
      address: z.string().min(1).optional(),
      phone1: z.string().regex(phoneRegex).optional(),
      phone2: z.string().regex(phoneRegex).optional().nullable(),
      location_link: z.string().optional().nullable(),
      description: z.string().min(1).optional(),
      status: z.enum(['Contacted', 'Samples Given', 'Follow Up Visit', 'Delivered']).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' }),
});

const statusSchema = z.object({
  query: z.any(),
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    newStatus: z.enum(['Contacted', 'Samples Given', 'Follow Up Visit', 'Delivered']),
    remark: z.string().max(500).optional(),
  }),
});

const importSchema = z.object({
  params: z.any(),
  query: z.any(),
  body: z.object({
    csvText: z.string().min(1),
  }),
});

export const affiliateValidation = {
  listSchema,
  idParamSchema,
  createSchema,
  updateSchema,
  statusSchema,
  importSchema,
  importJsonSchema: z.object({
    params: z.any(),
    query: z.any(),
    body: z.object({
      data: z.array(z.object({
        name: z.string().min(1),
        product: z.string().min(1),
        address: z.string().min(1),
        phone1: z.string().min(10),
        phone2: z.string().min(10).optional().nullable(),
        location_link: z.string().optional().nullable(),
        locationLink: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        status: z.string().optional().nullable(),
      })),
    }),
  }),
};

export const getList = asyncHandler(async (req, res) => {
  const payload = await listAffiliates(req.validated.query, req.auth);
  res.json(payload);
});

export const getById = asyncHandler(async (req, res) => {
  const payload = await getAffiliateById(req.validated.params.id, req.auth);
  res.json(payload);
});

export const create = asyncHandler(async (req, res) => {
  const payload = await createAffiliate(req.validated.body, req.auth);
  res.status(201).json(payload);
});

export const update = asyncHandler(async (req, res) => {
  const payload = await updateAffiliate(req.validated.params.id, req.validated.body, req.auth);
  res.json(payload);
});

export const moveStatus = asyncHandler(async (req, res) => {
  const payload = await transitionStatus(req.validated.params.id, req.validated.body, req.auth);
  res.json(payload);
});

export const exportCsv = asyncHandler(async (req, res) => {
  const csv = await exportAffiliatesCsv(req.auth);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="affiliates.csv"');
  res.send(csv);
});

export const importCsv = asyncHandler(async (req, res) => {
  const result = await importAffiliatesCsv(req.validated.body.csvText, req.auth);
  res.json(result);
});

export const importJson = asyncHandler(async (req, res) => {
  const result = await importAffiliatesJson(req.validated.body.data, req.auth);
  res.json(result);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await deleteAffiliate(req.validated.params.id, req.auth);
  res.json(result);
});
