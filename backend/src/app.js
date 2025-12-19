// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');

const config = require('./config');
const logger = require('./utils/logger');

const authRoutes = require('./modules/auth/auth.routes');

// ✅ import raw (may be router OR {router} OR {default} ...etc)
const healthRoutesRaw = require('./routes/health.routes');
const meRoutesRaw = require('./routes/me.routes');

const notFoundRaw = require('./middlewares/notfound.middleware');
const errorHandlerRaw = require('./middlewares/error.middleware');

const BOOT_STAMP = 'MEDCORE_BOOT_V6_2025-12-19';

function parseCorsOrigins(origins) {
  const v = String(origins || '*').trim();
  if (v === '*') return '*';
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

// ✅ robust resolver: returns an express Router/middleware function from any common export shape
function pickMiddleware(mod, name) {
  // direct function/router
  if (typeof mod === 'function') return mod;

  // common wrappers
  if (mod && typeof mod === 'object') {
    if (typeof mod.default === 'function') return mod.default;
    if (typeof mod.router === 'function') return mod.router;
    if (typeof mod.middleware === 'function') return mod.middleware;
    if (typeof mod.handler === 'function') return mod.handler;
    if (typeof mod[name] === 'function') return mod[name]; // e.g. exports.healthRoutes = router
  }

  return null;
}

function debugModule(mod, label) {
  const t = typeof mod;
  const keys = (mod && typeof mod === 'object') ? Object.keys(mod) : [];
  console.log(`DEBUG ${label}: typeof=${t}, keys=${JSON.stringify(keys)}`);
  if (mod && typeof mod === 'object') {
    for (const k of keys) {
      console.log(`DEBUG ${label}.${k}: typeof=${typeof mod[k]}`);
    }
  }
}

// 🔎 show what Railway is actually loading
console.log(`✅ ${BOOT_STAMP}`);
debugModule(healthRoutesRaw, 'healthRoutesRaw');
debugModule(meRoutesRaw, 'meRoutesRaw');
debugModule(notFoundRaw, 'notFoundRaw');
debugModule(errorHandlerRaw, 'errorHandlerRaw');
console.log('DEBUG authRoutes typeof:', typeof authRoutes);

// ✅ resolve to real middlewares/routers
const healthRoutes = pickMiddleware(healthRoutesRaw, 'healthRoutes') || pickMiddleware(healthRoutesRaw, 'health');
const meRoutes = pickMiddleware(meRoutesRaw, 'meRoutes') || pickMiddleware(meRoutesRaw, 'me');
const notFound = pickMiddleware(notFoundRaw, 'notFound') || pickMiddleware(notFoundRaw, 'notfound');
const errorHandler = pickMiddleware(errorHandlerRaw, 'errorHandler') || pickMiddleware(errorHandlerRaw, 'error');

// If STILL null, we will not crash; we will mount safe fallbacks.
if (!healthRoutes) {
  console.log('WARN healthRoutes unresolved -> mounting fallback /health handler');
}
if (!meRoutes) {
  console.log('WARN meRoutes unresolved -> skipping /me routes');
}
if (!notFound) {
  console.log('WARN notFound unresolved -> using inline notFound');
}
if (!errorHandler) {
  console.log('WARN errorHandler unresolved -> using inline error handler');
}

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: parseCorsOrigins(config.security.corsOrigins) }));

app.use(rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max
}));

app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger }));

// ✅ basic stamp endpoints
app.get(['/', '/health', '/api/health'], (req, res) => {
  res.json({ app: config.app?.name || 'medcore', status: 'ok', boot: BOOT_STAMP });
});

app.get(['/auth/_ping', '/api/auth/_ping'], (req, res) => {
  res.json({ ok: true, mounted: true, boot: BOOT_STAMP });
});

// ✅ mount routers (with safe fallbacks)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

if (healthRoutes) {
  app.use('/', healthRoutes);
} else {
  // fallback if health router export is broken
  app.get('/health-router-fallback', (req, res) => res.json({ ok: true, boot: BOOT_STAMP }));
}

if (meRoutes) {
  app.use('/', meRoutes);
}

// ✅ notfound + error handler
(app.use)(notFound || ((req, res) => res.status(404).json({ message: 'Not Found', path: req.originalUrl, boot: BOOT_STAMP })));

// eslint-disable-next-line no-unused-vars
(app.use)(errorHandler || ((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal Server Error', boot: BOOT_STAMP });
}));

module.exports = app;
