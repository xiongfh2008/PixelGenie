// Vercel Serverless Function for PixelGenie Backend
import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import server logic
import('../server/index.js').then(module => {
  const serverApp = module.default;
  // Copy all routes from server app
  app._router = serverApp._router;
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vercel serverless function is running' });
});

export default app;

