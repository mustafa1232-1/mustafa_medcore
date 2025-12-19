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

// ✅ Hard stamp (to verify Railway is running THIS file)
const BOOT_STAMP = 'BOOT_V3_2025-12-19';

console.log(`✅ ${BOOT_STAMP}`);
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

// ✅ health on both paths (detect prefix issues) + stamp
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    app: config.app?.name || 'medcore',
    status: 'ok',
    boot: BOOT_STAMP
  });
});

// ✅ app-level ping (no dependency on auth router)
app.get(['/auth/_ping', '/api/auth/_ping'], (req, res) => {
  res.json({ ok: true, mounted: true, boot: BOOT_STAMP });
});

// ✅ mount auth router on both paths (temporary)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

// fallback
app.use((req, res) => {
  res.status(404).json({
    message: 'Not Found',
    path: req.originalUrl,
    boot: BOOT_STAMP
  });
});

module.exports = app;
