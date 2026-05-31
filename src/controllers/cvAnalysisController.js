const cvAnalysisService = require('../services/cvAnalysisService');

const analyzeCV = async (req, res, next) => {
  try {
    const studentId = req.user.studentProfile?.id;
    if (!studentId) {
      return res.status(403).json({ message: 'Solo estudiantes pueden analizar CVs.' });
    }

    const { offerId } = req.body;

    const result = await cvAnalysisService.analyzeAndSave(studentId, offerId || null);

    return res.status(200).json({
      message: 'Análisis completado exitosamente.',
      analysis: result,
    });
  } catch (error) {
    return next(error);
  }
};

const getAnalysisHistory = async (req, res, next) => {
  try {
    const studentId = req.user.studentProfile?.id;
    if (!studentId) {
      return res.status(403).json({ message: 'Solo estudiantes pueden ver historial de análisis.' });
    }

    const limit = parseInt(req.query.limit, 10) || 20;
    const history = await cvAnalysisService.getAnalysisHistory(studentId, limit);

    return res.status(200).json({
      history,
      total: history.length,
    });
  } catch (error) {
    return next(error);
  }
};

const getAnalysisDetails = async (req, res, next) => {
  try {
    const studentId = req.user.studentProfile?.id;
    if (!studentId) {
      return res.status(403).json({ message: 'Solo estudiantes pueden ver detalles de análisis.' });
    }

    const { analysisId } = req.params;
    const analysis = await cvAnalysisService.getAnalysisById(analysisId, studentId);

    return res.status(200).json(analysis);
  } catch (error) {
    return next(error);
  }
};

const deleteAnalysis = async (req, res, next) => {
  try {
    const studentId = req.user.studentProfile?.id;
    if (!studentId) {
      return res.status(403).json({ message: 'Solo estudiantes pueden eliminar análisis.' });
    }

    const { analysisId } = req.params;
    const result = await cvAnalysisService.deleteAnalysis(analysisId, studentId);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  analyzeCV,
  getAnalysisHistory,
  getAnalysisDetails,
  deleteAnalysis,
};
