require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL, /\.vercel\.app$/].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET'],
}));
app.use(express.json({ limit: '10kb' }));

// ─── Health check (no rate limit) ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// ─── API routes (limits applied per-route in routes/api.js) ──────────────────
app.use('/api', apiRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`Server started`, { port: PORT, env: process.env.NODE_ENV || 'development' });

  if (!process.env.FINNHUB_API_KEY) {
    logger.warn('FINNHUB_API_KEY is not set. Copy .env.example to .env and add your key.');
  }
  if (!process.env.NEWSAPI_API_KEY) {
    logger.warn('NEWSAPI_API_KEY is not set. NewsAPI results will be skipped.');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Run: lsof -ti:${PORT} | xargs kill -9`);
    process.exit(1);
  } else {
    throw err;
  }
});

module.exports = app;
