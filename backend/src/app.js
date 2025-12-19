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

console.log('✅ app.js BOOT v2');

app.use(helmet());
app.use(compression());
app.use(cors({ origin: parseCorsOrigins(config.security.corsOrigins) }));

app.use(rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max
}));

app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger }));

// built-in health (بدون routes files)
app.get('/health', (req, res) => {
  res.json({ app: config.app?.name || 'medcore', status: 'ok' });
});

// auth only
app.use('/auth', authRoutes);

// fallback
app.use((req, res) => res.status(404).json({ message: 'Not Found', path: req.originalUrl }));

module.exports = app;
