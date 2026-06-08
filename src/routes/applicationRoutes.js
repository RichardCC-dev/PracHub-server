const express = require('express');
const { body, param } = require('express-validator');
const applicationController = require('../controllers/applicationController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /applications:
 *   post:
 *     summary: Crear una nueva postulación
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offerId
 *               - resumeId
 *             properties:
 *               offerId:
 *                 type: integer
 *               resumeId:
 *                 type: integer
 *               resumeVersionId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Postulación creada
 */
router.post(
  '/',
  authorize('student'),
  [
    body('offerId').isInt({ min: 1 }),
    body('resumeId').isInt({ min: 1 }),
    body('resumeVersionId').optional({ nullable: true }).isInt({ min: 1 }),
    validateRequest,
  ],
  applicationController.createApplication
);

router.get(
  '/preview/:offerId',
  authorize('student'),
  [
    param('offerId').isInt({ min: 1 }),
    validateRequest,
  ],
  applicationController.getApplicationPreview
);

/**
 * @swagger
 * /applications/my-applications:
 *   get:
 *     summary: Obtener mis postulaciones (Estudiante)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de postulaciones propias
 */
router.get(
  '/my-applications',
  authorize('student'),
  applicationController.getMyApplications
);

router.get(
  '/can-apply/:offerId',
  authorize('student'),
  [
    param('offerId').isInt({ min: 1 }),
    validateRequest,
  ],
  applicationController.canApply
);

/**
 * @swagger
 * /applications/offer/{offerId}:
 *   get:
 *     summary: Obtener postulaciones para una oferta (Empresa)
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de postulaciones para la oferta
 */
router.get(
  '/offer/:offerId',
  authorize('company'),
  [
    param('offerId').isInt({ min: 1 }),
    validateRequest,
  ],
  applicationController.getOfferApplications
);

/**
 * @swagger
 * /applications/{applicationId}/status:
 *   patch:
 *     summary: Actualizar estado de la postulación
 *     tags: [Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [enviada, revision, descartada, aceptada]
 *               notes:
 *                 type: string
 *               internalNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch(
  '/:applicationId/status',
  authorize('company'),
  [
    param('applicationId').isInt({ min: 1 }),
    body('status').isIn(['enviada', 'revision', 'descartada', 'aceptada']),
    body('notes').optional().isString().trim().isLength({ max: 1000 }),
    body('internalNotes').optional().isString().trim().isLength({ max: 2000 }),
    validateRequest,
  ],
  applicationController.updateApplicationStatus
);

router.get(
  '/:applicationId/download-cv',
  authorize('company'),
  [
    param('applicationId').isInt({ min: 1 }),
    validateRequest,
  ],
  applicationController.downloadCV
);

module.exports = router;
