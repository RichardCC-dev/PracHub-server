const { Router } = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const resumeController = require('../controllers/resumeController');

const router = Router();

router.use(authMiddleware);

router.get('/', resumeController.getResume);

router.post(
  '/export-pdf',
  [
    body('template')
      .isIn(['harvard', 'investment-banking'])
      .withMessage('Selecciona una plantilla válida: harvard o investment-banking.'),
  ],
  validateRequest,
  resumeController.exportPdf,
);

router.put(
  '/:section',
  [
    body().custom((value) => {
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('El cuerpo debe ser un objeto JSON con los campos a actualizar.');
      }
      return true;
    }),
  ],
  validateRequest,
  resumeController.updateSection,
);

router.post('/improve/:section/:field', resumeController.improveField);
router.post('/improve-section/:section', resumeController.improveFullSection);

module.exports = router;
