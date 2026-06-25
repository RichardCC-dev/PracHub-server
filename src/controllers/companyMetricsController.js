const { Company, sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * Obtiene las métricas de seguidores de una empresa.
 * Incluye total de seguidores y su distribución por carrera e universidad.
 *
 * Usa raw SQL para evitar problemas de resolución de columnas con Sequelize
 * en queries agregadas con JOIN + GROUP BY.
 */
const getFollowerMetrics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar que el usuario es empresa
    const company = await Company.findOne({ where: { userId } });
    if (!company) {
      return res.status(403).json({ error: 'No autorizado. Solo empresas pueden acceder.' });
    }

    const companyId = company.id;

    // Total de seguidores
    const [totalResult] = await sequelize.query(
      'SELECT COUNT(*) AS total FROM `saved_companies` WHERE `company_id` = ?',
      { replacements: [companyId], type: sequelize.QueryTypes.SELECT },
    );
    const totalFollowers = parseInt(totalResult.total, 10) || 0;

    // Distribución por carrera
    const followersByCareer = await sequelize.query(
      `SELECT s.\`career\` AS career, COUNT(*) AS count
       FROM \`saved_companies\` sc
       INNER JOIN \`Students\` s ON s.\`id\` = sc.\`student_id\`
       WHERE sc.\`company_id\` = ?
       GROUP BY s.\`career\``,
      { replacements: [companyId], type: sequelize.QueryTypes.SELECT },
    );

    // Distribución por universidad
    const followersByUniversity = await sequelize.query(
      `SELECT s.\`university\` AS university, COUNT(*) AS count
       FROM \`saved_companies\` sc
       INNER JOIN \`Students\` s ON s.\`id\` = sc.\`student_id\`
       WHERE sc.\`company_id\` = ?
       GROUP BY s.\`university\``,
      { replacements: [companyId], type: sequelize.QueryTypes.SELECT },
    );

    logger.info(`[companyMetricsController] Métricas obtenidas para empresa ${companyId}`);

    res.json({
      totalFollowers,
      byCareer: followersByCareer.map(item => ({
        career: item.career || 'No especificada',
        count: parseInt(item.count, 10) || 0,
      })),
      byUniversity: followersByUniversity.map(item => ({
        university: item.university || 'No especificada',
        count: parseInt(item.count, 10) || 0,
      })),
    });
  } catch (error) {
    logger.error('[companyMetricsController] Error al obtener métricas:', error);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
};

/**
 * Obtiene el histórico de crecimiento de seguidores (últimos 30 días).
 * Datos agregados por día.
 *
 * Usa raw SQL para evitar problemas de resolución de columnas con Sequelize.
 */
const getFollowerGrowth = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verificar que el usuario es empresa
    const company = await Company.findOne({ where: { userId } });
    if (!company) {
      return res.status(403).json({ error: 'No autorizado. Solo empresas pueden acceder.' });
    }

    const companyId = company.id;

    // Últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const growthData = await sequelize.query(
      `SELECT DATE(\`followed_at\`) AS date, COUNT(*) AS dailyFollowers
       FROM \`saved_companies\`
       WHERE \`company_id\` = ? AND \`followed_at\` >= ?
       GROUP BY DATE(\`followed_at\`)
       ORDER BY DATE(\`followed_at\`) ASC`,
      { replacements: [companyId, thirtyDaysAgo], type: sequelize.QueryTypes.SELECT },
    );

    logger.info(`[companyMetricsController] Crecimiento de seguidores obtenido para empresa ${companyId}`);

    res.json({
      growth: growthData.map(item => ({
        date: item.date,
        dailyFollowers: parseInt(item.dailyFollowers, 10) || 0,
      })),
    });
  } catch (error) {
    logger.error('[companyMetricsController] Error al obtener crecimiento:', error);
    res.status(500).json({ error: 'Error al obtener crecimiento de seguidores' });
  }
};

module.exports = {
  getFollowerMetrics,
  getFollowerGrowth,
};
