const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.post(
  '/students/register',
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

module.exports = router;
