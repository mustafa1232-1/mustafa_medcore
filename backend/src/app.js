const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');

const config = require('./config');
const logger = require('./utils/logger');

const notFound = require('./middlewares/notfound.middleware');
const errorHandler = require('./middlewares/error.middleware');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const meRoutes = require('./routes/me.routes');

function parseCorsOrigins(origins) {
  // supports: "*" OR "https://a.com,https://b.com"
  const v = String(origins || '*').trim();
  if (v === '*') return '*';
  return v.split(',').map(s => s.trim()).filter(Boolean);
}

const app = express();
app.get('/__routes', (req, res) => {
  const routes = [];
  const stack = app._router?.stack || [];
  for (const layer of stack) {
    if (layer.route?.path) {
      const methods = Object.keys(layer.route.methods).filter(Boolean);
      routes.push({ path: layer.route.path, methods });
    }
  }
  res.json({ routes });
});

// security & performance
app.use(helmet());
app.use(compression());

app.use(cors({
  origin: parseCorsOrigins(config.security.corsOrigins)
}));

app.use(rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.max
}));

app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger }));

// quick root ping
app.get('/', (req, res) => {
  res.json({ app: config.app.name, status: 'ok' });
});

// routes
console.log('✅ app.js loaded');
app.use('/', healthRoutes);

console.log('✅ mounting /auth routes');
app.use('/auth', authRoutes);

app.use('/', meRoutes);
// errors
app.use(notFound);
app.use(errorHandler);

module.exports = app;
