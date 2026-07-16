const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');
const { adminLoginLimiter, loginLimiter, registerLimiter } = require('../middlewares/rateLimit');
const authMiddleware = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/authorize');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Error en credenciales
 */
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Ingresa un correo válido.'),
    body('password').notEmpty().withMessage('Ingresa tu contraseña.'),
  ],
  validateRequest,
  authController.login,
);

router.post(
  '/login/admin',
  adminLoginLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Ingresa un correo válido.'),
    body('password').notEmpty().withMessage('Ingresa tu contraseña.'),
    body('adminSecret').notEmpty().withMessage('Ingresa la clave de acceso administrativo.'),
  ],
  validateRequest,
  authController.login,
);

/**
 * @swagger
 * /auth/students/register:
 *   post:
 *     summary: Registrar estudiante
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - career
 *               - cycle
 *               - availability
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               university:
 *                 type: string
 *               career:
 *                 type: string
 *               cycle:
 *                 type: string
 *               availability:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Estudiante registrado exitosamente
 *       400:
 *         description: Datos inválidos o el correo ya existe
 */
router.post(
  '/students/register',
  registerLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Ingresa un correo válido.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres.')
      .matches(/[A-Z]/)
      .withMessage('La contraseña debe incluir una mayúscula.')
      .matches(/[a-z]/)
      .withMessage('La contraseña debe incluir una minúscula.')
      .matches(/\d/)
      .withMessage('La contraseña debe incluir un número.'),
    body('firstName').trim().escape().isLength({ min: 2, max: 80 }).withMessage('Ingresa nombres válidos.'),
    body('lastName').trim().escape().isLength({ min: 2, max: 80 }).withMessage('Ingresa apellidos válidos.'),
    body('university').optional({ checkFalsy: true }).trim().escape().isLength({ max: 160 }),
    body('career').trim().escape().isLength({ min: 2, max: 140 }).withMessage('Ingresa una carrera válida.'),
    body('cycle').trim().escape().isLength({ min: 1, max: 30 }).withMessage('Ingresa tu ciclo académico.'),
    body('availability').trim().escape().isLength({ min: 2, max: 80 }).withMessage('Ingresa tu disponibilidad.'),
    body('phoneNumber').optional({ checkFalsy: true }).trim().escape().isLength({ max: 30 }),
  ],
  validateRequest,
  authController.registerStudent,
);

router.post(
  '/forgot-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Ingresa un correo válido.'),
  ],
  validateRequest,
  authController.requestPasswordReset,
);

router.post(
  '/reset-password',
  [
    body('token').trim().isLength({ min: 64, max: 64 }).isHexadecimal().withMessage('El token de recuperación es inválido.'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.')
      .matches(/[A-Z]/)
      .withMessage('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.')
      .matches(/[a-z]/)
      .withMessage('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.')
      .matches(/\d/)
      .withMessage('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.'),
  ],
  validateRequest,
  authController.resetPassword,
);

router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @swagger
 * /auth/students/profile:
 *   put:
 *     summary: Actualizar perfil de estudiante
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               university:
 *                 type: string
 *               career:
 *                 type: string
 *               cycle:
 *                 type: string
 *               availability:
 *                 type: string
 *               bio:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *       404:
 *         description: Perfil de estudiante no encontrado
 */
router.put(
  '/students/profile',
  authMiddleware,
  authorize('student'),
  [
    body('firstName').optional({ checkFalsy: true }).trim().escape().isLength({ min: 2, max: 80 }).withMessage('Ingresa nombres válidos.'),
    body('lastName').optional({ checkFalsy: true }).trim().escape().isLength({ min: 2, max: 80 }).withMessage('Ingresa apellidos válidos.'),
    body('university').optional({ checkFalsy: true }).trim().escape().isLength({ max: 160 }),
    body('career').optional({ checkFalsy: true }).trim().escape().isLength({ min: 2, max: 140 }).withMessage('Ingresa una carrera válida.'),
    body('cycle').optional({ checkFalsy: true }).trim().escape().isLength({ min: 1, max: 30 }).withMessage('Ingresa tu ciclo académico.'),
    body('availability').optional({ checkFalsy: true }).trim().escape().isLength({ min: 2, max: 80 }).withMessage('Ingresa tu disponibilidad.'),
    body('bio').optional({ checkFalsy: true }).trim().escape().isLength({ max: 2000 }),
    body('phoneNumber').optional({ checkFalsy: true }).trim().escape().isLength({ max: 30 }),
  ],
  validateRequest,
  authController.updateStudentProfile,
);

module.exports = router;
