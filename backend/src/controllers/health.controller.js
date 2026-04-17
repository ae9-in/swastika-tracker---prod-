import { asyncHandler } from '../utils/asyncHandler.js';
import { query } from '../config/db.js';

export const health = asyncHandler(async (_req, res) => {
  const { rows } = await query('select now() as now');
  res.json({ status: 'ok', dbTime: rows[0].now });
});
