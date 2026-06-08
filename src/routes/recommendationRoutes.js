const express = require('express');
const { getRecommendations } = require('../controllers/recommendationController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

const router = express.Router();

/**
 * @swagger
 * /recommendations:
 *   get:
 *     summary: Obtener recomendaciones de ofertas (Estudiante)
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ofertas recomendadas
 */
router.get('/', authenticate, authorize('student'), getRecommendations);

module.exports = router;
