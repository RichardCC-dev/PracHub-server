const express = require('express');
const savedCompanyController = require('../controllers/savedCompanyController');
const authenticate = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const authorize = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);
router.use(authorize('student'));

// Empresas seguidas
router.get('/', savedCompanyController.getFollowedCompanies);
router.get('/count', savedCompanyController.getFollowedCount);
router.get('/suggested', savedCompanyController.getSuggestedCompanies);
router.get('/feed', savedCompanyController.getFollowedCompaniesFeed);

// Seguir/Dejar de seguir
router.post(
  '/:companyId/follow',
  savedCompanyController.validateCompanyId,
  validateRequest,
  savedCompanyController.followCompany
);

router.delete(
  '/:companyId/unfollow',
  savedCompanyController.validateCompanyId,
  validateRequest,
  savedCompanyController.unfollowCompany
);

// Verificar si sigue a una empresa
router.get(
  '/:companyId/is-following',
  savedCompanyController.validateCompanyId,
  validateRequest,
  savedCompanyController.isFollowing
);

// Actualizar preferencias de notificaciones
router.patch(
  '/:companyId/notifications',
  savedCompanyController.validateNotificationPreference,
  validateRequest,
  savedCompanyController.updateNotificationPreference
);

module.exports = router;
