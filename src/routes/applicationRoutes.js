const express = require('express');
const { body, param } = require('express-validator');
const applicationController = require('../controllers/applicationController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize('student'),
  [
    body('offerId').isInt({ min: 1 }),
    body('resumeId').isInt({ min: 1 }),
    body('coverLetter').optional({ nullable: true }).isString().trim().isLength({ max: 5000 }),
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

router.get(
  '/offer/:offerId',
  authorize('company'),
  [
    param('offerId').isInt({ min: 1 }),
    validateRequest,
  ],
  applicationController.getOfferApplications
);

router.patch(
  '/:applicationId/status',
  authorize('company'),
  [
    param('applicationId').isInt({ min: 1 }),
    body('status').isIn(['enviada', 'revision', 'descartada', 'aceptada']),
    body('notes').optional().isString().trim().isLength({ max: 1000 }),
    validateRequest,
  ],
  applicationController.updateApplicationStatus
);

module.exports = router;
