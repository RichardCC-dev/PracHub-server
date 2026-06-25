const express = require('express');
const { body, param } = require('express-validator');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const validateRequest = require('../middlewares/validateRequest');
const offerController = require('../controllers/offerController');

const router = express.Router();

// Middleware reutilizable: autenticación + rol empresa
const requireCompany = [authenticate, authorize('company')];

const offerValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('El título es requerido.')
    .isLength({ max: 200 }).withMessage('El título no puede exceder 200 caracteres.')
    .escape(),
  body('description')
    .trim()
    .notEmpty().withMessage('La descripción es requerida.')
    .isLength({ min: 20 }).withMessage('La descripción debe tener al menos 20 caracteres.')
    .escape(),
  body('area')
    .trim()
    .notEmpty().withMessage('El área es requerida.')
    .isLength({ max: 100 }).withMessage('El área no puede exceder 100 caracteres.')
    .escape(),
  body('modality')
    .isIn(['remote', 'in_person', 'hybrid']).withMessage('Modalidad inválida.'),
  body('requirements')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Los requisitos no pueden exceder 2000 caracteres.')
    .escape(),
  body('duration')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 }).withMessage('La duración no puede exceder 50 caracteres.')
    .escape(),
  body('compensation')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 }).withMessage('La compensación no puede exceder 100 caracteres.')
    .escape(),
  body('careerTags')
    .optional({ nullable: true })
    .isArray({ max: 5 }).withMessage('Las carreras afines no pueden ser más de 5.'),
  body('careerTags.*')
    .optional()
    .isString().withMessage('Cada carrera afín debe ser un texto.')
    .isLength({ max: 100 }).withMessage('Cada carrera afín no puede exceder 100 caracteres.')
    .escape(),
  body('expiresAt')
    .optional({ nullable: true })
    .isISO8601().withMessage('La fecha de expiración debe ser una fecha válida.'),
];

/**
 * @swagger
 * /offers:
 *   get:
 *     summary: Obtener todas las ofertas públicas (aprobadas)
 *     tags: [Offers]
 *     parameters:
 *       - in: query
 *         name: modality
 *         schema: { type: string, enum: [remote, in_person, hybrid] }
 *       - in: query
 *         name: area
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de ofertas
 */
router.get('/', offerController.getAllOffers);

/**
 * @swagger
 * /offers/my:
 *   get:
 *     summary: Obtener mis ofertas (Empresa)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ofertas propias
 */
router.get('/my', requireCompany, offerController.getMyOffers);

/**
 * @swagger
 * /offers:
 *   post:
 *     summary: Crear una nueva oferta
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - area
 *               - modality
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               area: { type: string }
 *               modality:
 *                 type: string
 *                 enum: [remote, in_person, hybrid]
 *               requirements: { type: string }
 *               duration: { type: string }
 *               compensation: { type: string }
 *               careerTags:
 *                 type: array
 *                 items: { type: string }
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Oferta creada
 */
router.post('/', requireCompany, offerValidation, validateRequest, offerController.createOffer);

/**
 * @swagger
 * /offers/{offerId}:
 *   get:
 *     summary: Obtener el detalle público de una oferta aprobada
 *     description: Accesible para estudiantes y por URL directa. Solo devuelve ofertas aprobadas.
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Detalle de la oferta
 *       404:
 *         description: Oferta no encontrada o no disponible
 */
router.get('/:offerId', param('offerId').isInt(), validateRequest, offerController.getPublicOfferById);

/**
 * @swagger
 * /offers/{offerId}:
 *   put:
 *     summary: Actualizar una oferta (Empresa)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Oferta actualizada
 */
router.put('/:offerId', requireCompany, offerValidation, validateRequest, offerController.updateOffer);

/**
 * @swagger
 * /offers/{offerId}/close:
 *   patch:
 *     summary: Cerrar una oferta (Empresa)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Oferta cerrada
 */
router.patch('/:offerId/close', requireCompany, param('offerId').isInt(), validateRequest, offerController.closeOffer);

module.exports = router;
