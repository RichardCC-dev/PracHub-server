const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const simulationController = require('../controllers/simulationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Validaciones
const startValidation = [
  check('simulatedRole', 'El rol simulado es requerido').notEmpty().trim().escape()
];

const messageValidation = [
  check('message', 'El mensaje no puede estar vacío').notEmpty().trim().escape()
];

// Rutas protegidas (solo estudiantes autenticados)
router.use(authMiddleware);

// Iniciar nueva simulación
router.post('/start', startValidation, simulationController.startSimulation);

// Obtener historial de simulaciones
router.get('/history', simulationController.getSimulationsHistory);

// Obtener detalle de una simulación
router.get('/:id', simulationController.getSimulationDetails);

// Enviar un mensaje
router.post('/:id/message', messageValidation, simulationController.sendMessage);

// Finalizar simulación
router.post('/:id/end', simulationController.endSimulation);

module.exports = router;
