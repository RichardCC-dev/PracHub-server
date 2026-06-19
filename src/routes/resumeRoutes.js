const { Router } = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const resumeController = require('../controllers/resumeController');
const { aiImproveLimiter } = require('../middlewares/rateLimit');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /resume:
 *   get:
 *     summary: Obtener el CV del estudiante
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CV obtenido
 */
router.get('/', resumeController.getResume);

/**
 * @swagger
 * /resume/export-pdf:
 *   post:
 *     summary: Exportar CV a PDF
 *     description: Genera y descarga el PDF. No crea una versión en el historial (el guardado es manual).
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *             properties:
 *               template:
 *                 type: string
 *                 enum: [harvard, investment-banking]
 *     responses:
 *       200:
 *         description: PDF generado
 */
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

/**
 * @swagger
 * /resume/{section}:
 *   put:
 *     summary: Actualizar sección del CV
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *           enum: [profile, personal, education, experience, skills, languages, projects, certifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Sección actualizada
 */
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

/**
 * @swagger
 * /resume/improve/{section}/{field}:
 *   post:
 *     summary: Mejorar un campo específico del CV usando IA
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: field
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sugerencia generada
 */
router.post('/improve/:section/:field', aiImproveLimiter, resumeController.improveField);

/**
 * @swagger
 * /resume/improve-section/{section}:
 *   post:
 *     summary: Mejorar una sección completa del CV usando IA
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sugerencia generada
 */
router.post('/improve-section/:section', aiImproveLimiter, resumeController.improveFullSection);

/**
 * @swagger
 * /resume/versions:
 *   post:
 *     summary: Guardar manualmente una versión del CV con un título
 *     description: Crea una nueva entrada en el historial de versiones a partir del CV actual.
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 120
 *                 description: Título personalizado de la versión
 *               template:
 *                 type: string
 *                 enum: [harvard, investment-banking]
 *     responses:
 *       201:
 *         description: Versión guardada
 *   get:
 *     summary: Obtener historial de versiones del CV
 *     tags: [Resume]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de versiones obtenido
 */
router.post(
  '/versions',
  [
    body('title')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 120 }).withMessage('El título no puede exceder 120 caracteres.'),
    body('template')
      .optional({ checkFalsy: true })
      .isIn(['harvard', 'investment-banking']).withMessage('Plantilla inválida.'),
  ],
  validateRequest,
  resumeController.saveVersion,
);
router.get('/versions', resumeController.getVersions);
router.get('/versions/:versionId/pdf', resumeController.exportVersionPdf);
router.post('/versions/:versionId/restore', resumeController.restoreVersion);
router.delete('/versions/:versionId', resumeController.deleteVersion);

module.exports = router;
