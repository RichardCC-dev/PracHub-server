const authService = require('../services/authService');

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

module.exports = {
  registerStudent,
  requestPasswordReset,
  resetPassword,
};
