import express from 'express';
import app from './backend/src/app.js';
import path from 'path';

const distPath = path.join(process.cwd(), 'dist');

app.use(express.static(distPath));
app.use(express.static(path.join(distPath, 'assets')));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;