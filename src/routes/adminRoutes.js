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

// GET /api/admin/offers/pending - Listar ofertas pendientes
router.get('/offers/pending', adminController.getPendingOffers);

// GET /api/admin/offers/stats - Estadísticas de ofertas
router.get('/offers/stats', adminController.getOfferStats);

// GET /api/admin/offers/history - Historial de moderación
router.get('/offers/history', adminController.getModerationHistory);

// POST /api/admin/offers/:offerId/approve - Aprobar oferta
router.post('/offers/:offerId/approve', adminController.approveOffer);

// POST /api/admin/offers/:offerId/reject - Rechazar oferta
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
