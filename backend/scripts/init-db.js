import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const schemaPath = path.resolve(__dirname, '../postgresql/schema.sql');
  const sql = await fs.readFile(schemaPath, 'utf8');
  await pool.query(sql);
  // eslint-disable-next-line no-console
  console.log('Database schema initialized successfully.');
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize database schema:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
