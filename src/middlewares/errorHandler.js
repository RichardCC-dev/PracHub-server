const errorHandler = (error, req, res, next) => {
  console.error('[ErrorHandler]', error.message, '- Status:', error.statusCode || 500);

  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Error interno del servidor.' : error.message;

  return res.status(statusCode).json({ message });
};

module.exports = errorHandler;
