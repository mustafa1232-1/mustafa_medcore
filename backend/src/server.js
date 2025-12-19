const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const PORT = config.server.port || process.env.PORT || 8080;

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(
    {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
    },
    '🚀 MedCore API server running'
  );
});

// graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
