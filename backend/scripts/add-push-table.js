import { pool } from '../src/config/db.js';

async function main() {
  const sql = `
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      subscription_json jsonb NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  `;
  await pool.query(sql);
  console.log('Push subscriptions table created successfully.');
}

main().catch(console.error).finally(() => pool.end());
