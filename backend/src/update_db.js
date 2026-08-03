import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL is not defined in .env');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  console.log('Connecting to database...');
  const client = await pool.connect();
  try {
    console.log('Dropping old constraint affiliates_status_check if exists...');
    await client.query('ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_status_check;');
    
    console.log('Adding new constraint affiliates_status_check with Delivered status...');
    await client.query(`
      ALTER TABLE affiliates 
      ADD CONSTRAINT affiliates_status_check 
      CHECK (status IN ('Contacted', 'Samples Given', 'Follow Up Visit', 'Delivered'));
    `);
    
    console.log('Adding location_link column if not exists...');
    await client.query('ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS location_link TEXT;');

    console.log('Database constraint and column updated successfully!');
  } catch (error) {
    console.error('Error updating database check constraint:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
