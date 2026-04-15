import pg from 'pg';
import fs from 'fs';

const { Pool } = pg;

const localPool = new Pool({
  connectionString: 'postgres://postgres:konduru2002@127.0.0.1:5432/swastika_tracker',
});

const neonPool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_8kCIglcvAZi2@ep-noisy-mountain-anm7p8tr-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

async function exportData() {
  console.log('Exporting data from local PostgreSQL...');
  
  const tables = ['businesses', 'app_users', 'user_business_access', 'affiliates', 'affiliate_status_history', 'audit_logs', 'reminders', 'activities'];
  const data = {};
  
  for (const table of tables) {
    const result = await localPool.query(`SELECT * FROM ${table}`);
    data[table] = result.rows;
    console.log(`Exported ${result.rows.length} rows from ${table}`);
  }
  
  await localPool.end();
  
  fs.writeFileSync('data.json', JSON.stringify(data, (key, value) => {
    if (value instanceof Date) return value.toISOString();
    return value;
  }, 2));
  
  console.log('Data exported to data.json');
  return data;
}

async function importData() {
  console.log('Importing data to Neon...');
  
  const raw = fs.readFileSync('data.json', 'utf8');
  const data = JSON.parse(raw);
  
  const tables = ['businesses', 'app_users', 'user_business_access', 'affiliates', 'affiliate_status_history', 'audit_logs', 'reminders', 'activities'];
  
  for (const table of tables) {
    if (data[table] && data[table].length > 0) {
      for (const row of data[table]) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
        try {
          await neonPool.query(query, values);
        } catch (e) {
          console.log(`Error inserting into ${table}: ${e.message}`);
        }
      }
      console.log(`Imported ${data[table].length} rows into ${table}`);
    }
  }
  
  await neonPool.end();
  console.log('Data migration complete!');
}

const cmd = process.argv[2];
if (cmd === 'export') {
  exportData().catch(console.error);
} else if (cmd === 'import') {
  importData().catch(console.error);
} else {
  console.log('Usage: node migrate.js export OR node migrate.js import');
}