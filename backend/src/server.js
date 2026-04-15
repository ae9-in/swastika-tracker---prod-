import app from './src/app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = process.env.VERCEL 
  ? join(__dirname, '../frontend/dist') 
  : join(__dirname, '../../dist');

app.use((req, res, next) => {
  const indexPath = join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

const server = app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);