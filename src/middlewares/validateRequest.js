const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.debug('[ValidateRequest] Body recibido:', req.body);
    logger.debug('[ValidateRequest] Errores:', errors.array());
    return res.status(400).json({
      message: 'Datos de entrada inválidos.',
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  return next();
};

module.exports = validateRequest;
