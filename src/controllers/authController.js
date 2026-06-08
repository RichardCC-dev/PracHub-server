const authService = require('../services/authService');
const emailService = require('../services/emailService');
const { User } = require('../models');
const logger = require('../utils/logger');

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    // Alert on successful admin login
    if (result.user?.role === 'admin') {
      try {
        await emailService.sendAdminLoginAlert({
          email: result.user.email,
          ip: req.ip,
          status: 'Éxito',
        });
      } catch (alertErr) {
        logger.error('[AdminLoginAlert] Error enviando alerta:', alertErr.message);
      }
    }

    return res.status(200).json({ message: 'Inicio de sesión exitoso.', ...result });
  } catch (error) {
    // Alert on failed admin login where adminSecret was wrong
    if (error.statusCode === 403 && error.message === 'Clave de acceso de administrador inválida.') {
      try {
        await emailService.sendAdminLoginAlert({
          email: req.body.email,
          ip: req.ip,
          status: 'Bloqueado',
        });
      } catch (alertErr) {
        logger.error('[AdminLoginAlert] Error enviando alerta:', alertErr.message);
      }
    }
    return next(error);
  }
};

const registerStudent = async (req, res, next) => {
  try {
    const result = await authService.registerStudent(req.body);
    return res.status(201).json({
      message: 'Registro de estudiante completado correctamente.',
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const result = await authService.requestPasswordReset(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json({
      message: 'Contraseña actualizada correctamente.',
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const result = await authService.verifyEmail(token);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  registerStudent,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
};
