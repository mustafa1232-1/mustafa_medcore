const http = require('http');
const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');

const PORT = process.env.PORT || config.port || 8080;

const server = http.createServer(app);

server.listen(PORT, () => {
  logger.info(
    { port: PORT, env: config.env, app: config.app?.name },
    'API server running'
  );
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down...');
  server.close(() => process.exit(0));
});
