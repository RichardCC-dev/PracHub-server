const express = require('express');
const { body } = require('express-validator');
const authenticate = require('../middlewares/authMiddleware');
const authorizeAdmin = require('../middlewares/authorizeAdmin');
const validateRequest = require('../middlewares/validateRequest');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * @swagger
 * /admin/companies:
 *   get:
 *     summary: Listar todas las empresas (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas
 */
router.get('/companies', adminController.getCompanies);

/**
 * @swagger
 * /admin/companies/{companyId}/enable:
 *   post:
 *     summary: Habilitar publicación para una empresa (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Publicación habilitada
 */
router.post('/companies/:companyId/enable', adminController.enableCompanyPublishing);

/**
 * @swagger
 * /admin/companies/{companyId}/disable:
 *   post:
 *     summary: Deshabilitar publicación para una empresa (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Publicación deshabilitada
 */
router.post('/companies/:companyId/disable', adminController.disableCompanyPublishing);

/**
 * @swagger
 * /admin/offers/status/{status}:
 *   get:
 *     summary: Listar ofertas por estado (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de ofertas
 */
router.get('/offers/status/:status', adminController.getOffersByStatus);

/**
 * @swagger
 * /admin/offers/pending:
 *   get:
 *     summary: Listar ofertas pendientes (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ofertas pendientes
 */
router.get('/offers/pending', adminController.getPendingOffers);

/**
 * @swagger
 * /admin/offers/stats:
 *   get:
 *     summary: Obtener estadísticas de ofertas (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas
 */
router.get('/offers/stats', adminController.getOfferStats);

/**
 * @swagger
 * /admin/offers/history:
 *   get:
 *     summary: Historial de moderación (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de moderación
 */
router.get('/offers/history', adminController.getModerationHistory);

/**
 * @swagger
 * /admin/offers/{offerId}/approve:
 *   post:
 *     summary: Aprobar oferta (Admin)
 *     tags: [Admin]
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
 *         description: Oferta aprobada
 */
router.post('/offers/:offerId/approve', adminController.approveOffer);

/**
 * @swagger
 * /admin/offers/{offerId}/reject:
 *   post:
 *     summary: Rechazar oferta (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
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
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Oferta rechazada
 */
router.post(
  '/offers/:offerId/reject',
  [
    body('rejectionReason')
      .trim()
      .notEmpty()
      .withMessage('El motivo de rechazo es requerido.')
      .isLength({ min: 10, max: 500 })
      .withMessage('El motivo debe tener entre 10 y 500 caracteres.')
      .escape(),
    validateRequest,
  ],
  adminController.rejectOffer
);

module.exports = router;
