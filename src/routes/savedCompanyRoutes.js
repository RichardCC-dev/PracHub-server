const express = require('express');
const savedCompanyController = require('../controllers/savedCompanyController');
const authenticate = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const authorize = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);
router.use(authorize('student'));

/**
 * @swagger
 * /saved-companies:
 *   get:
 *     summary: Obtener empresas seguidas
 *     tags: [Saved Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas seguidas
 */
router.get('/', savedCompanyController.getFollowedCompanies);

/**
 * @swagger
 * /saved-companies/count:
 *   get:
 *     summary: Obtener cantidad de empresas seguidas
 *     tags: [Saved Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cantidad
 */
router.get('/count', savedCompanyController.getFollowedCount);

/**
 * @swagger
 * /saved-companies/suggested:
 *   get:
 *     summary: Obtener empresas sugeridas
 *     tags: [Saved Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de empresas
 */
router.get('/suggested', savedCompanyController.getSuggestedCompanies);

/**
 * @swagger
 * /saved-companies/feed:
 *   get:
 *     summary: Obtener feed de ofertas de empresas seguidas
 *     tags: [Saved Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feed de ofertas
 */
router.get('/feed', savedCompanyController.getFollowedCompaniesFeed);

/**
 * @swagger
 * /saved-companies/{companyId}/follow:
 *   post:
 *     summary: Seguir una empresa
 *     tags: [Saved Companies]
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
 *         description: Empresa seguida exitosamente
 */
router.post(
  '/:companyId/follow',
  savedCompanyController.validateCompanyId,
  validateRequest,
  savedCompanyController.followCompany
);

/**
 * @swagger
 * /saved-companies/{companyId}/unfollow:
 *   delete:
 *     summary: Dejar de seguir empresa
 *     tags: [Saved Companies]
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
 *         description: Empresa dejada de seguir
 */
router.delete(
  '/:companyId/unfollow',
  savedCompanyController.validateCompanyId,
  validateRequest,
  savedCompanyController.unfollowCompany
);

/**
 * @swagger
 * /saved-companies/{companyId}/is-following:
 *   get:
 *     summary: Verificar si se sigue a una empresa
 *     tags: [Saved Companies]
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
 *         description: Estado de seguimiento
 */
router.get(
  '/:companyId/is-following',
  savedCompanyController.validateCompanyId,
  validateRequest,
  savedCompanyController.isFollowing
);

/**
 * @swagger
 * /saved-companies/{companyId}/notifications:
 *   patch:
 *     summary: Actualizar preferencias de notificaciones
 *     tags: [Saved Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiveNotifications:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferencias actualizadas
 */
router.patch(
  '/:companyId/notifications',
  savedCompanyController.validateNotificationPreference,
  validateRequest,
  savedCompanyController.updateNotificationPreference
);

module.exports = router;
