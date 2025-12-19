const env = require('./env');

module.exports = {
  env: env.NODE_ENV,
  port: env.PORT,
jwt: {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN
},

  app: {
    name: env.APP_NAME,
    version: env.APP_VERSION
  },

  security: {
    corsOrigins: env.CORS_ORIGINS,
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX
    }
  },

  verification: {
    mode: env.VERIFICATION_MODE
  }
};
