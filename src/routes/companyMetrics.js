const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const {
  getFollowerMetrics,
  getFollowerGrowth,
} = require('../controllers/companyMetricsController');

const router = express.Router();

/**
 * Ruta: GET /api/company-metrics/followers
 * Descripción: Obtiene el total de seguidores y su distribución por carrera e universidad
 * Autenticación: JWT requerido. Solo para empresas (company role)
 * Respuesta: { totalFollowers, byCareer, byUniversity }
 */
router.get('/followers', authMiddleware, authorize('company'), getFollowerMetrics);

/**
 * Ruta: GET /api/company-metrics/growth
 * Descripción: Obtiene el crecimiento de seguidores en los últimos 30 días
 * Autenticación: JWT requerido. Solo para empresas (company role)
 * Respuesta: { growth: [ { date, dailyFollowers } ] }
 */
router.get('/growth', authMiddleware, authorize('company'), getFollowerGrowth);

module.exports = router;
