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

module.exports = {
  registerStudent,
};
