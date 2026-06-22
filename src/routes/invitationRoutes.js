const express = require('express');
const { body, param } = require('express-validator');
const invitationController = require('../controllers/invitationController');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

/**
 * Rutas de Invitaciones a Postular (HU-18)
 * Base: /api/invitations
 */

/**
 * POST /api/invitations/send
 * Enviar invitación a postular a un candidato
 * Acceso: Solo companies autenticadas
 */
router.post(
  '/send',
  authMiddleware,
  authorize('company'),
  [
    body('studentId')
      .isInt({ min: 1 })
      .withMessage('studentId must be a valid integer'),
    body('offerId')
      .isInt({ min: 1 })
      .withMessage('offerId must be a valid integer'),
    body('recruiterMessage')
      .optional()
      .isLength({ max: 300 })
      .withMessage('Message cannot exceed 300 characters')
      .trim()
      .escape(),
  ],
  validateRequest,
  invitationController.sendInvitation
);

/**
 * GET /api/invitations
 * Listar invitaciones del estudiante actual
 * Acceso: Solo students autenticados
 *
 * Query:
 * - status: PENDING | ACCEPTED | DECLINED (default: PENDING)
 */
router.get(
  '/',
  authMiddleware,
  authorize('student'),
  invitationController.getInvitations
);

/**
 * POST /api/invitations/:id/respond
 * Responder a una invitación (aceptar o declinar)
 * Acceso: Solo students autenticados
 *
 * Body:
 * - response: ACCEPTED | DECLINED
 */
router.post(
  '/:id/respond',
  authMiddleware,
  authorize('student'),
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Invalid invitation ID'),
    body('response')
      .isIn(['ACCEPTED', 'DECLINED'])
      .withMessage('Response must be ACCEPTED or DECLINED'),
  ],
  validateRequest,
  invitationController.respondToInvitation
);

/**
 * GET /api/invitations/stats/:offerId
 * Obtener estadísticas de invitaciones para una oferta
 * Acceso: Solo el propietario de la oferta (company)
 */
router.get(
  '/stats/:offerId',
  authMiddleware,
  authorize('company'),
  [
    param('offerId')
      .isInt({ min: 1 })
      .withMessage('Invalid offer ID'),
  ],
  validateRequest,
  invitationController.getInvitationStats
);

module.exports = router;
