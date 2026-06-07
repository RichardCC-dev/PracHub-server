const express = require('express');
const alertController = require('../controllers/alertController');
const authenticate = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const authorize = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);
router.use(authorize('student'));

// Configuración de alertas
router.get('/settings', alertController.getSettings);

router.patch(
  '/settings',
  alertController.validateSettingsUpdate,
  validateRequest,
  alertController.updateSettings
);

// Historial de alertas
router.get(
  '/history',
  alertController.validateHistoryQuery,
  validateRequest,
  alertController.getAlertHistory
);

module.exports = router;
