const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log('[ValidateRequest] Body recibido:', req.body);
    console.log('[ValidateRequest] Errores:', errors.array());
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
