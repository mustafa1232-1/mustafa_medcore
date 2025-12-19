const { ZodError } = require('zod');

module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      issues: err.issues
    });
  }

  const status = err.status || 500;

  // لا نُظهر stack في production
  const payload = {
    message: err.message || 'Internal Server Error'
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  return res.status(status).json(payload);
};
