const { SavedCompany, Company, Student } = require('../models');
const logger = require('../utils/logger');

/**
 * Servicio para operaciones de métricas de seguidores.
 * Separa la lógica de negocio del controller.
 */

/**
 * Calcula estadísticas adicionales de seguidores.
 * (Extensible para análisis más complejos en el futuro)
 */
const calculateFollowerStats = async (companyId) => {
  try {
    const totalFollowers = await SavedCompany.count({
      where: { companyId },
    });

    const uniqueUniversities = await SavedCompany.count({
      distinct: true,
      col: 'student.university',
      include: [
        {
          model: Student,
          as: 'student',
          attributes: [],
          required: true,
        },
      ],
      where: { companyId },
    });

    const uniqueCareers = await SavedCompany.count({
      distinct: true,
      col: 'student.career',
      include: [
        {
          model: Student,
          as: 'student',
          attributes: [],
          required: true,
        },
      ],
      where: { companyId },
    });

    return {
      totalFollowers,
      uniqueUniversities,
      uniqueCareers,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error('[companyMetricsService] Error en calculateFollowerStats:', error.message);
    throw error;
  }
};

/**
 * Obtiene los detalles de seguidores filtrados opcionalmente.
 * Útil para exportar reportes o análisis adicionales.
 */
const getFollowerDetails = async (companyId, filters = {}) => {
  try {
    const where = { companyId };
    const studentWhere = {};

    if (filters.career) {
      studentWhere.career = filters.career;
    }
    if (filters.university) {
      studentWhere.university = filters.university;
    }

    const followers = await SavedCompany.findAll({
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['firstName', 'lastName', 'career', 'university', 'profilePictureUrl'],
          where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
          required: true,
        },
      ],
      where,
      order: [['savedAt', 'DESC']],
      limit: filters.limit || 1000,
    });

    return followers;
  } catch (error) {
    logger.error('[companyMetricsService] Error en getFollowerDetails:', error.message);
    throw error;
  }
};

module.exports = {
  calculateFollowerStats,
  getFollowerDetails,
};
