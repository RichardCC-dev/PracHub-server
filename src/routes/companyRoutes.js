const express = require('express');
const { body } = require('express-validator');
const companyController = require('../controllers/companyController');
const validateRequest = require('../middlewares/validateRequest');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

const router = express.Router();

const VALID_INDUSTRIES = [
  'Tecnología',
  'Finanzas',
  'Salud',
  'Educación',
  'Manufactura',
  'Retail',
  'Consultoría',
  'Marketing',
  'Ingeniería',
  'Legal',
  'Otro',
];

const VALID_COMPANY_SIZES = ['micro', 'small', 'medium', 'large'];

const VALID_COUNTRIES = ['Perú', 'Colombia', 'México', 'Chile', 'Argentina', 'Ecuador', 'Bolivia', 'Otro'];

router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Ingresa un correo válido.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres.')
      .matches(/[A-Z]/)
      .withMessage('La contraseña debe incluir una mayúscula.')
      .matches(/[a-z]/)
      .withMessage('La contraseña debe incluir una minúscula.')
      .matches(/\d/)
      .withMessage('La contraseña debe incluir un número.'),
    body('taxId')
      .trim()
      .notEmpty()
      .withMessage('El RUC/NIT es obligatorio.')
      .isLength({ min: 6, max: 20 })
      .withMessage('El RUC/NIT debe tener entre 6 y 20 caracteres.')
      .matches(/^[0-9]+$/)
      .withMessage('El RUC/NIT debe contener solo números.'),
    body('legalName')
      .trim()
      .notEmpty()
      .withMessage('La razón social es obligatoria.')
      .isLength({ min: 2, max: 200 })
      .withMessage('La razón social debe tener entre 2 y 200 caracteres.')
      .escape(),
    body('tradeName')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 200 })
      .escape(),
    body('description')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 })
      .escape(),
    body('industry')
      .trim()
      .notEmpty()
      .withMessage('El sector/industria es obligatorio.')
      .isIn(VALID_INDUSTRIES)
      .withMessage(`Sector inválido. Opciones válidas: ${VALID_INDUSTRIES.join(', ')}.`),
    body('companySize')
      .trim()
      .notEmpty()
      .withMessage('El tamaño de empresa es obligatorio.')
      .isIn(VALID_COMPANY_SIZES)
      .withMessage(`Tamaño inválido. Opciones: ${VALID_COMPANY_SIZES.join(', ')}.`),
    body('websiteUrl')
      .optional({ checkFalsy: true })
      .trim()
      .isURL()
      .withMessage('La URL del sitio web no es válida.'),
    body('country')
      .optional({ checkFalsy: true })
      .trim()
      .isIn(VALID_COUNTRIES)
      .withMessage(`País inválido. Opciones: ${VALID_COUNTRIES.join(', ')}.`),
    body('city')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 })
      .escape(),
    body('address')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 300 })
      .escape(),
    body('responsibleName')
      .trim()
      .notEmpty()
      .withMessage('El nombre del responsable es obligatorio.')
      .isLength({ min: 2, max: 160 })
      .withMessage('El nombre debe tener entre 2 y 160 caracteres.')
      .escape(),
    body('responsiblePosition')
      .trim()
      .notEmpty()
      .withMessage('El cargo del responsable es obligatorio.')
      .isLength({ min: 2, max: 100 })
      .withMessage('El cargo debe tener entre 2 y 100 caracteres.')
      .escape(),
    body('responsiblePhone')
      .trim()
      .notEmpty()
      .withMessage('El teléfono del responsable es obligatorio.')
      .isLength({ min: 6, max: 30 })
      .withMessage('El teléfono debe tener entre 6 y 30 caracteres.')
      .escape(),
  ],
  validateRequest,
  companyController.registerCompany,
);

router.get('/verify-email/:token', companyController.verifyEmail);

router.get('/profile', authenticate, authorize('company'), companyController.getProfile);

router.patch(
  '/profile',
  authenticate,
  authorize('company'),
  [
    body('description')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 1000 })
      .escape(),
    body('websiteUrl')
      .optional({ checkFalsy: true })
      .trim()
      .isURL()
      .withMessage('La URL no es válida.'),
    body('logoUrl')
      .optional({ checkFalsy: true })
      .trim()
      .isURL()
      .withMessage('La URL del logo no es válida.'),
    body('city')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 })
      .escape(),
    body('address')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 300 })
      .escape(),
    body('responsiblePhone')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 6, max: 30 })
      .escape(),
  ],
  validateRequest,
  companyController.updateProfile,
);

module.exports = router;
