import pg from 'pg';
const { Pool } = pg;

export default async (req, res) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const start = Date.now();
    const { rows } = await pool.query('SELECT 1 as connected');
    const latency = Date.now() - start;
    
    res.json({
      status: 'ok',
      db: 'connected',
      latency: `${latency}ms`,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL
      }
    });
  } finally {
    await pool.end();
  }
};
