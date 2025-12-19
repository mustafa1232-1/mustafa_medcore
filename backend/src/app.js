const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');

const config = require('./config');
const logger = require('./utils/logger');

const notFoundRaw = require('./middlewares/notfound.middleware');
const errorHandlerRaw = require('./middlewares/error.middleware');

const healthRoutesRaw = require('./routes/health.routes');
const authRoutesRaw = require('./modules/auth/auth.routes');
const meRoutesRaw = require('./routes/me.routes');

function parseCorsOrigins(origins) {
  const v = String(origins || '*').trim();
  if (v === '*') return '*';
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

// ✅ normalize module exports: supports module.exports = router, {router}, {default}
function asMiddleware(mod) {
  return mod?.default || mod?.router || mod;
}

const healthRoutes = asMiddleware(healthRoutesRaw);
const authRoutes = asMiddleware(authRoutesRaw);
const meRoutes = asMiddleware(meRoutesRaw);
const notFound = asMiddleware(notFoundRaw);
const errorHandler = asMiddleware(errorHandlerRaw);

const app = express();

console.log('✅ app.js loaded');
console.log('typeof healthRoutes:', typeof healthRoutes);
console.log('typeof authRoutes:', typeof authRoutes);
console.log('typeof meRoutes:', typeof meRoutes);
console.log('typeof notFound:', typeof notFound);
console.log('typeof errorHandler:', typeof errorHandler);

// security & performance
app.use(helmet());
app.use(compression());

app.use(cors({
  origin: parseCorsOrigins(config.security.corsOrigins),
}));

app.use(rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max,
}));

app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger }));

app.get('/', (req, res) => {
  res.json({ app: config.app?.name || 'medcore', status: 'ok' });
});

// routes
app.use('/', healthRoutes);
app.use('/auth', authRoutes);
app.use('/', meRoutes);

// errors
app.use(notFound);
app.use(errorHandler);

module.exports = app;
