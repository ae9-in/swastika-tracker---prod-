import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = process.env.VERCEL 
  ? path.join(process.cwd(), 'dist') 
  : path.join(__dirname, 'dist');

const app = express();

app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;