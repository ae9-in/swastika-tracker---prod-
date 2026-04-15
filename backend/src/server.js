import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

const port = process.env.PORT || env.port;

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
