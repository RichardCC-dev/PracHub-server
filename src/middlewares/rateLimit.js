const rateLimit = require('express-rate-limit');

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => rateLimit.ipKeyGenerator(req, res),
  handler: (req, res) => {
    res.status(429).json({
      message: 'Demasiados intentos de acceso administrativo. Intenta nuevamente en 15 minutos.',
    });
  },
});

module.exports = { adminLoginLimiter };
