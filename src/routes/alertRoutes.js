const express = require('express');
const alertController = require('../controllers/alertController');
const authenticate = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const authorize = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);
router.use(authorize('student'));

/**
 * @swagger
 * /alerts/settings:
 *   get:
 *     summary: Obtener configuración de alertas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuración de alertas
 */
router.get('/settings', alertController.getSettings);

/**
 * @swagger
 * /alerts/settings:
 *   patch:
 *     summary: Actualizar configuración de alertas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_notifications:
 *                 type: boolean
 *               push_notifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Configuración actualizada
 */
router.patch(
  '/settings',
  alertController.validateSettingsUpdate,
  validateRequest,
  alertController.updateSettings
);

/**
 * @swagger
 * /alerts/history:
 *   get:
 *     summary: Obtener historial de alertas
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de alertas
 */
router.get(
  '/history',
  alertController.validateHistoryQuery,
  validateRequest,
  alertController.getAlertHistory
);

module.exports = router;
