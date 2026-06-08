const logger = require('../utils/logger');

// Campos sensibles que nunca deben aparecer en los logs
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'authorization', 'cookie'];

function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return {};
  return Object.fromEntries(
    Object.entries(body).map(([k, v]) =>
      SENSITIVE_FIELDS.some((f) => k.toLowerCase().includes(f)) ? [k, '[REDACTED]'] : [k, v]
    )
  );
}

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  logger.error('HTTP Error', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    statusCode,
    message: error.message,
    stack: statusCode === 500 ? error.stack : undefined,
    body: sanitizeBody(req.body),
  });

  if (res.headersSent) {
    return next(error);
  }

  const message = statusCode === 500 ? 'Error interno del servidor.' : error.message;

  return res.status(statusCode).json({ message });
};

module.exports = errorHandler;
