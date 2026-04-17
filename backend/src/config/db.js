import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 1000,
  max: 10,
});

export async function query(text, params = []) {
  const result = await pool.query(text, params);
  return result;
}
