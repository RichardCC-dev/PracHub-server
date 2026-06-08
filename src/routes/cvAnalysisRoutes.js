const { Router } = require('express');
const { body, param } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const cvAnalysisController = require('../controllers/cvAnalysisController');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /cv-analysis:
 *   post:
 *     summary: Realizar nuevo análisis de CV (con o sin oferta)
 *     tags: [CV Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               offerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Análisis completado
 */
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

/**
 * @swagger
 * /cv-analysis/history:
 *   get:
 *     summary: Obtener historial de análisis de CV
 *     tags: [CV Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Historial de análisis
 */
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

/**
 * @swagger
 * /cv-analysis/{analysisId}:
 *   get:
 *     summary: Obtener detalles de un análisis
 *     tags: [CV Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del análisis
 */
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

/**
 * @swagger
 * /cv-analysis/{analysisId}:
 *   delete:
 *     summary: Eliminar un análisis
 *     tags: [CV Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Análisis eliminado
 */
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
