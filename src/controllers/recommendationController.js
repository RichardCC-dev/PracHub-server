const recommendationService = require('../services/recommendationService');
const logger = require('../utils/logger');

const getRecommendations = async (req, res) => {
  try {
    const studentId = req.user.studentProfile.id; // Asumiendo que el middleware auth injecta esto
    
    if (!studentId) {
      return res.status(403).json({ error: 'Acceso denegado. Solo estudiantes pueden ver recomendaciones.' });
    }

    const recommendations = await recommendationService.getRecommendedOffers(studentId);

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    if (error.message === 'El estudiante no tiene un CV registrado') {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Error in getRecommendations:', error);
    res.status(500).json({ error: 'Error interno al generar recomendaciones' });
  }
};

module.exports = {
  getRecommendations
};
