/**
 * Setup global de Jest: suprime logs y desactiva rate limiters en tests.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest-1234567890';
process.env.LOG_LEVEL = 'silent';

// Silenciar Winston en tests
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Desactivar rate limiters en tests (passthrough middleware)
jest.mock('../src/middlewares/rateLimit', () => {
  const passthrough = (_req, _res, next) => next();
  return {
    globalApiLimiter:      passthrough,
    loginLimiter:          passthrough,
    registerLimiter:       passthrough,
    companyRegisterLimiter: passthrough,
    aiImproveLimiter:      passthrough,
    adminLoginLimiter:     passthrough,
  };
});
