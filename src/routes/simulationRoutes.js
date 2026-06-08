const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const simulationController = require('../controllers/simulationController');
const authMiddleware = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

// Validaciones
const startValidation = [
  check('simulatedRole', 'El rol simulado es requerido').notEmpty().trim().escape()
];

const messageValidation = [
  check('message', 'El mensaje no puede estar vacío').notEmpty().trim().escape()
];

// Rutas protegidas (solo estudiantes autenticados)
router.use(authMiddleware);

/**
 * @swagger
 * /simulations/start:
 *   post:
 *     summary: Iniciar nueva simulación de entrevista
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - simulatedRole
 *             properties:
 *               simulatedRole:
 *                 type: string
 *               career:
 *                 type: string
 *               sector:
 *                 type: string
 *     responses:
 *       201:
 *         description: Simulación iniciada
 */
router.post('/start', startValidation, validateRequest, simulationController.startSimulation);

/**
 * @swagger
 * /simulations/history:
 *   get:
 *     summary: Obtener historial de simulaciones
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de simulaciones
 */
router.get('/history', simulationController.getSimulationsHistory);

/**
 * @swagger
 * /simulations/stats:
 *   get:
 *     summary: Obtener estadísticas de progreso
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de progreso
 */
router.get('/stats', simulationController.getSimulationStats);

/**
 * @swagger
 * /simulations/{id}:
 *   get:
 *     summary: Obtener detalle de una simulación
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle de la simulación
 */
router.get('/:id', simulationController.getSimulationDetails);

/**
 * @swagger
 * /simulations/{id}/message:
 *   post:
 *     summary: Enviar un mensaje en la simulación
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Respuesta del entrevistador
 */
router.post('/:id/message', messageValidation, simulationController.sendMessage);

/**
 * @swagger
 * /simulations/{id}/end:
 *   post:
 *     summary: Finalizar simulación
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Simulación finalizada y analizada
 */
router.post('/:id/end', simulationController.endSimulation);

module.exports = router;
