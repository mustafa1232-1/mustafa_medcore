const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');

const config = require('./config');
const logger = require('./utils/logger');

const authRoutes = require('./modules/auth/auth.routes');

function parseCorsOrigins(origins) {
  const v = String(origins || '*').trim();
  if (v === '*') return '*';
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

const app = express();

console.log('✅ app.js BOOT v3');
console.log('typeof authRoutes:', typeof authRoutes);

app.use(helmet());
app.use(compression());
app.use(cors({ origin: parseCorsOrigins(config.security.corsOrigins) }));

app.use(rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max
}));

app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger }));

// health on both paths (to detect prefix issues)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ app: config.app?.name || 'medcore', status: 'ok' });
});

// app-level ping on both paths (no dependency on auth router)
app.get(['/auth/_ping', '/api/auth/_ping'], (req, res) => {
  res.json({ ok: true, mounted: true });
});

// mount auth router on both paths (temporary)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

// fallback
app.use((req, res) => res.status(404).json({ message: 'Not Found', path: req.originalUrl }));

module.exports = app;
