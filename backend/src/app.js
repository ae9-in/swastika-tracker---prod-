import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

const corsOptions = env.corsOrigin === '*'
  ? { origin: true }
  : { origin: env.corsOrigin.includes(',') ? env.corsOrigin.split(',').map(s => s.trim()) : env.corsOrigin };

app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

export default app;
