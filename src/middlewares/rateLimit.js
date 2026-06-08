const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Detectar si estamos en produccion
const isProduction = process.env.NODE_ENV === 'production';

// Middleware passthrough para desarrollo (no aplica rate limiting)
const passthrough = (req, res, next) => next();

// Helper para respuestas de rate-limit consistentes
const rateLimitHandler = (message) => (req, res) => {
  res.status(429).json({ message });
};

/**
 * Limiter global: 100 requests por IP cada 15 minutos.
 * NOTA: Desactivado en desarrollo para facilitar demos con multiples usuarios.
 */
const globalApiLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler(
        'Demasiadas solicitudes desde esta IP. Intenta nuevamente en 15 minutos.'
      ),
    })
  : passthrough;

/**
 * Login general (/api/auth/login): 5 intentos/IP cada 15 min.
 * NOTA: Desactivado en desarrollo para facilitar demos con multiples usuarios.
 */
const loginLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler(
        'Demasiados intentos de inicio de sesion. Intenta nuevamente en 15 minutos.'
      ),
    })
  : passthrough;

/**
 * Registro de estudiantes (/api/auth/students/register): 3 intentos/IP por hora.
 * NOTA: Desactivado en desarrollo para facilitar demos con multiples usuarios.
 */
const registerLimiter = isProduction
  ? rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler(
        'Demasiados intentos de registro desde esta IP. Intenta nuevamente en 1 hora.'
      ),
    })
  : passthrough;

/**
 * Registro de empresas (/api/companies/register): 3 intentos/IP por hora.
 * NOTA: Desactivado en desarrollo para facilitar demos con multiples usuarios.
 */
const companyRegisterLimiter = isProduction
  ? rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 3,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler(
        'Demasiados intentos de registro desde esta IP. Intenta nuevamente en 1 hora.'
      ),
    })
  : passthrough;

/**
 * Mejora con IA (/api/resume/improve/*): 10 solicitudes por usuario cada 5 min.
 * Si el usuario esta autenticado, la clave es su userId; si no, usa la IP
 * (con ipKeyGenerator para compatibilidad IPv6).
 * NOTA: En desarrollo permite mas peticiones (50) para facilitar testing.
 */
const aiImproveLimiter = isProduction
  ? rateLimit({
      windowMs: 5 * 60 * 1000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req, res) =>
        req.user?.id ? `user_${req.user.id}` : ipKeyGenerator(req, res),
      handler: rateLimitHandler(
        'Has alcanzado el limite de mejoras con IA. Espera 5 minutos antes de continuar.'
      ),
    })
  : rateLimit({
      windowMs: 5 * 60 * 1000,
      max: 50, // Muy relajado en dev para testing
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req, res) =>
        req.user?.id ? `user_${req.user.id}` : ipKeyGenerator(req, res),
      handler: rateLimitHandler(
        'Has alcanzado el limite de mejoras con IA. Espera 5 minutos antes de continuar.'
      ),
    });

/**
 * Login de admin (/api/auth/login/admin): 5 intentos/IP cada 15 min.
 * NOTA: Desactivado en desarrollo para facilitar demos con multiples usuarios.
 */
const adminLoginLimiter = isProduction
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler(
        'Demasiados intentos de acceso administrativo. Intenta nuevamente en 15 minutos.'
      ),
    })
  : passthrough;

module.exports = {
  globalApiLimiter,
  loginLimiter,
  registerLimiter,
  companyRegisterLimiter,
  aiImproveLimiter,
  adminLoginLimiter,
};
