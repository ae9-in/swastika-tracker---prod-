import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();
const distPath = path.join(process.cwd(), 'dist');

app.use(cors());
app.use(express.static(distPath));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;