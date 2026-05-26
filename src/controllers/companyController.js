const companyService = require('../services/companyService');

const registerCompany = async (req, res, next) => {
  try {
    const result = await companyService.registerCompany(req.body);
    return res.status(201).json({
      message: 'Registro de empresa iniciado. Verifica tu correo para continuar.',
      ...result,
    });
  } catch (error) {
    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  console.log('[CompanyController] verifyEmail llamado con token:', req.params.token);
  try {
    const { token } = req.params;
    const result = await companyService.verifyEmail(token);
    console.log('[CompanyController] verifyEmail exitoso');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[CompanyController] verifyEmail error:', error.message);
    return next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await companyService.getCompanyProfile(req.user.id);
    return res.status(200).json({
      message: 'Perfil de empresa obtenido correctamente.',
      user: result,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await companyService.updateCompanyProfile(req.user.id, req.body);
    return res.status(200).json({
      message: 'Perfil de empresa actualizado correctamente.',
      user: result,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerCompany,
  verifyEmail,
  getProfile,
  updateProfile,
};
