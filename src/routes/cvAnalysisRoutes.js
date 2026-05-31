const { Router } = require('express');
const { body, param } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const cvAnalysisController = require('../controllers/cvAnalysisController');

const router = Router();

router.use(authMiddleware);

// POST /api/cv-analysis - Realizar nuevo análisis
router.post(
  '/',
  [
    body('offerId')
      .optional({ nullable: true })
      .isInt({ min: 1 })
      .withMessage('El ID de la oferta debe ser un número entero positivo.'),
  ],
  validateRequest,
  cvAnalysisController.analyzeCV,
);

// GET /api/cv-analysis/history - Obtener historial de análisis
router.get(
  '/history',
  [
    body('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe estar entre 1 y 100.'),
  ],
  validateRequest,
  cvAnalysisController.getAnalysisHistory,
);

// GET /api/cv-analysis/:analysisId - Obtener detalles de un análisis
router.get(
  '/:analysisId',
  [
    param('analysisId')
      .isInt({ min: 1 })
      .withMessage('El ID del análisis debe ser un número entero positivo.'),
  ],
  validateRequest,
  cvAnalysisController.getAnalysisDetails,
);

// DELETE /api/cv-analysis/:analysisId - Eliminar un análisis
router.delete(
  '/:analysisId',
  [
    param('analysisId')
      .isInt({ min: 1 })
      .withMessage('El ID del análisis debe ser un número entero positivo.'),
  ],
  validateRequest,
  cvAnalysisController.deleteAnalysis,
);

module.exports = router;
