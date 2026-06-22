const { Company, User, Student, SavedCompany, sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * Obtiene las métricas de seguidores de una empresa.
 * Incluye total de seguidores y su distribución por carrera e universidad.
 */
const getFollowerMetrics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar que el usuario es empresa
    const company = await Company.findOne({ where: { userId } });
    if (!company) {
      return res.status(403).json({ error: 'No autorizado. Solo empresas pueden acceder.' });
    }

    // Total de seguidores
    const totalFollowers = await SavedCompany.count({
      where: { companyId: company.id },
    });

    // Distribución por carrera
    const followersByCareer = await SavedCompany.findAll({
      attributes: [
        [sequelize.col('student.career'), 'career'],
        [sequelize.fn('COUNT', sequelize.col('SavedCompany.id')), 'count'],
      ],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: [],
          required: true,
        },
      ],
      where: { companyId: company.id },
      group: ['student.career'],
      raw: true,
      subQuery: false,
    });

    // Distribución por universidad
    const followersByUniversity = await SavedCompany.findAll({
      attributes: [
        [sequelize.col('student.university'), 'university'],
        [sequelize.fn('COUNT', sequelize.col('SavedCompany.id')), 'count'],
      ],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: [],
          required: true,
        },
      ],
      where: { companyId: company.id },
      group: ['student.university'],
      raw: true,
      subQuery: false,
    });

    logger.info(`[companyMetricsController] Métricas obtenidas para empresa ${company.id}`);

    res.json({
      totalFollowers,
      byCareer: followersByCareer.map(item => ({
        career: item.career || 'No especificada',
        count: parseInt(item.count) || 0,
      })),
      byUniversity: followersByUniversity.map(item => ({
        university: item.university || 'No especificada',
        count: parseInt(item.count) || 0,
      })),
    });
  } catch (error) {
    logger.error('[companyMetricsController] Error al obtener métricas:', error.message);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
};

/**
 * Obtiene el histórico de crecimiento de seguidores (últimos 30 días).
 * Datos agregados por día.
 */
const getFollowerGrowth = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar que el usuario es empresa
    const company = await Company.findOne({ where: { userId } });
    if (!company) {
      return res.status(403).json({ error: 'No autorizado. Solo empresas pueden acceder.' });
    }

    // Últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const growthData = await SavedCompany.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('saved_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('SavedCompany.id')), 'dailyFollowers'],
      ],
      where: {
        companyId: company.id,
        savedAt: { [sequelize.Op.gte]: thirtyDaysAgo },
      },
      group: [sequelize.fn('DATE', sequelize.col('saved_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('saved_at')), 'ASC']],
      raw: true,
      subQuery: false,
    });

    logger.info(`[companyMetricsController] Crecimiento de seguidores obtenido para empresa ${company.id}`);

    res.json({
      growth: growthData.map(item => ({
        date: item.date,
        dailyFollowers: parseInt(item.dailyFollowers) || 0,
      })),
    });
  } catch (error) {
    logger.error('[companyMetricsController] Error al obtener crecimiento:', error.message);
    res.status(500).json({ error: 'Error al obtener crecimiento de seguidores' });
  }
};

module.exports = {
  getFollowerMetrics,
  getFollowerGrowth,
};
