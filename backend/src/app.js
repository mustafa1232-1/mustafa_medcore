// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');

const config = require('./config');
const logger = require('./utils/logger');

const healthRoutesImport = require('./routes/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const meRoutes = require('./routes/me.routes');

const notFoundImport = require('./middlewares/notfound.middleware');
const errorHandler = require('./middlewares/error.middleware');
const healthRoutes = healthRoutesImport?.default || healthRoutesImport?.router || healthRoutesImport;
const notFound = notFoundImport?.default || notFoundImport?.notFound || notFoundImport;
function parseCorsOrigins(origins) {
  const v = String(origins || '*').trim();
  if (v === '*') return '*';
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

const app = express();

// ✅ Hard stamp
const BOOT_STAMP = 'MEDCORE_BOOT_V5_2025-12-19';
console.log(`✅ ${BOOT_STAMP}`);

// ✅ Print exact types (THIS will reveal the object immediately)
console.log('typeof healthRoutes:', typeof healthRoutes);
console.log('typeof authRoutes:', typeof authRoutes);
console.log('typeof meRoutes:', typeof meRoutes);
console.log('typeof notFound:', typeof notFound);
console.log('typeof errorHandler:', typeof errorHandler);

// ✅ Fail fast with clear error (instead of Express generic)
function assertIsFnOrRouter(name, v) {
  const ok =
    typeof v === 'function' ||
    (v && typeof v === 'object' && typeof v.handle === 'function' && typeof v.use === 'function');
  if (!ok) {
    throw new Error(`${name} must be a function/router, got: ${Object.prototype.toString.call(v)}`);
  }
}

assertIsFnOrRouter('healthRoutes', healthRoutes);
assertIsFnOrRouter('authRoutes', authRoutes);
assertIsFnOrRouter('meRoutes', meRoutes);
assertIsFnOrRouter('notFound', notFound);
// errorHandler is middleware function (function), must be function:
if (typeof errorHandler !== 'function') {
  throw new Error(`errorHandler must be a function, got: ${Object.prototype.toString.call(errorHandler)}`);
}

app.use(helmet());
app.use(compression());
app.use(cors({ origin: parseCorsOrigins(config.security.corsOrigins) }));

app.use(
  rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.max,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger }));

// ✅ Health
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    app: config.app?.name || 'medcore',
    status: 'ok',
    boot: BOOT_STAMP,
  });
});

// ✅ Mount routes
app.use('/', healthRoutes);
app.use('/auth', authRoutes);
app.use('/', meRoutes);

// ✅ 404 + Error
app.use(notFound);
app.use(errorHandler);

module.exports = app;
