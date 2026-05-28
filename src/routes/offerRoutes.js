const express = require('express');
const { body, param } = require('express-validator');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const validateRequest = require('../middlewares/validateRequest');
const offerController = require('../controllers/offerController');

const router = express.Router();

// GET /api/offers - Obtener todas las ofertas públicas (para estudiantes)
// Esta ruta es pública y no requiere autenticación de empresa
router.get('/', offerController.getAllOffers);

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
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Los requisitos no pueden exceder 2000 caracteres.')
    .escape(),
  body('duration')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('La duración no puede exceder 50 caracteres.')
    .escape(),
  body('compensation')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La compensación no puede exceder 100 caracteres.')
    .escape(),
  body('careerTags')
    .optional()
    .isArray({ max: 5 }).withMessage('Las carreras afines no pueden ser más de 5.'),
  body('careerTags.*')
    .optional()
    .isString().withMessage('Cada carrera afín debe ser un texto.')
    .isLength({ max: 100 }).withMessage('Cada carrera afín no puede exceder 100 caracteres.')
    .escape(),
  body('expiresAt')
    .optional()
    .isISO8601().withMessage('La fecha de expiración debe ser una fecha válida.'),
];

// Todas las rutas debajo requieren auth y rol company
router.use(authenticate);
router.use(authorize('company'));

// GET /api/offers/my - Mis ofertas (DEBE ir antes de /:offerId)
router.get('/my', offerController.getMyOffers);

// POST /api/offers - Crear oferta
router.post('/', offerValidation, validateRequest, offerController.createOffer);

// GET /api/offers/:offerId - Ver oferta por ID (requiere auth para empresas)
router.get('/:offerId', param('offerId').isInt(), validateRequest, offerController.getOfferById);

// PUT /api/offers/:offerId - Editar oferta
router.put('/:offerId', offerValidation, validateRequest, offerController.updateOffer);

// PATCH /api/offers/:offerId/close - Cerrar oferta
router.patch('/:offerId/close', param('offerId').isInt(), validateRequest, offerController.closeOffer);

module.exports = router;
