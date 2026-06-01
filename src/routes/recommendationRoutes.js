const express = require('express');
const { getRecommendations } = require('../controllers/recommendationController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// Ruta protegida solo para estudiantes
router.get('/', authenticate, authorize('student'), getRecommendations);

module.exports = router;
