import express from 'express';
import app from './backend/src/app.js';
import { pool } from './backend/src/config/db.js';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');

app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;