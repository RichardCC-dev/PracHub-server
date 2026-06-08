const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Helper para respuestas de rate-limit consistentes
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({ message });
};

/**
 * Limiter global: 100 requests por IP cada 15 minutos.
 */
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Demasiadas solicitudes desde esta IP. Intenta nuevamente en 15 minutos.'
  ),
});

/**
 * Login general (/api/auth/login): 5 intentos/IP cada 15 min.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.'
  ),
});

/**
 * Registro de estudiantes (/api/auth/students/register): 3 intentos/IP por hora.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Demasiados intentos de registro desde esta IP. Intenta nuevamente en 1 hora.'
  ),
});

/**
 * Registro de empresas (/api/companies/register): 3 intentos/IP por hora.
 */
const companyRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Demasiados intentos de registro desde esta IP. Intenta nuevamente en 1 hora.'
  ),
});

/**
 * Mejora con IA (/api/resume/improve/*): 10 solicitudes por usuario cada 5 min.
 * Si el usuario está autenticado, la clave es su userId; si no, usa la IP
 * (con ipKeyGenerator para compatibilidad IPv6).
 */
const aiImproveLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) =>
    req.user?.id ? `user_${req.user.id}` : ipKeyGenerator(req, res),
  handler: rateLimitHandler(
    'Has alcanzado el límite de mejoras con IA. Espera 5 minutos antes de continuar.'
  ),
});

/**
 * Login de admin (/api/auth/login/admin): 5 intentos/IP cada 15 min.
 */
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler(
    'Demasiados intentos de acceso administrativo. Intenta nuevamente en 15 minutos.'
  ),
});

module.exports = {
  globalApiLimiter,
  loginLimiter,
  registerLimiter,
  companyRegisterLimiter,
  aiImproveLimiter,
  adminLoginLimiter,
};
