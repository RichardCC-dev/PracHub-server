const express = require('express');
const messageController = require('../controllers/messageController');
const authenticate = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// Todas las rutas requieren autenticación.
// Accesible para estudiantes y empresas (no admin).
router.use(authenticate);
router.use(authorize('student', 'company'));

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: >
 *     Mensajería directa entre usuarios (HU-24, HU-25, HU-26).
 *     Permite a reclutadores (company) enviar mensajes a candidatos (student)
 *     y a estudiantes responder desde su bandeja de entrada.
 */

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Enviar un mensaje directo
 *     description: >
 *       Envía un mensaje a otro usuario del sistema.
 *       Un reclutador puede escribir a un estudiante (HU-24) y un estudiante
 *       puede responder a mensajes recibidos (HU-25 / HU-26).
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverId
 *               - content
 *             properties:
 *               receiverId:
 *                 type: integer
 *                 description: ID del usuario receptor
 *                 example: 42
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Contenido del mensaje
 *                 example: "Hola, me gustaría discutir tu postulación."
 *     responses:
 *       201:
 *         description: Mensaje enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DirectMessage'
 *                 message:
 *                   type: string
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Rol no autorizado
 *       404:
 *         description: Usuario receptor no encontrado
 */
router.post(
  '/',
  messageController.validateSendMessage,
  validateRequest,
  messageController.sendMessage
);

/**
 * @swagger
 * /messages/inbox:
 *   get:
 *     summary: Obtener bandeja de entrada (lista de conversaciones)
 *     description: >
 *       Devuelve todas las conversaciones activas del usuario autenticado,
 *       agrupadas por el otro participante. Incluye el último mensaje y
 *       el conteo de mensajes no leídos por conversación (HU-25).
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conversaciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: No autenticado
 */
router.get('/inbox', messageController.getInbox);

/**
 * @swagger
 * /messages/unread-count:
 *   get:
 *     summary: Obtener cantidad de mensajes no leídos
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo de mensajes no leídos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 */
router.get('/unread-count', messageController.getUnreadCount);

/**
 * @swagger
 * /messages/conversation/{userId}:
 *   get:
 *     summary: Obtener historial de mensajes con un usuario
 *     description: >
 *       Devuelve todos los mensajes intercambiados entre el usuario autenticado
 *       y el usuario identificado por `userId`, ordenados cronológicamente.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del otro participante de la conversación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de mensajes a retornar
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Desplazamiento para paginación
 *     responses:
 *       200:
 *         description: Historial de la conversación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 otherUser:
 *                   $ref: '#/components/schemas/Participant'
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DirectMessage'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Usuario no encontrado
 */
router.get(
  '/conversation/:userId',
  messageController.validateUserId,
  messageController.validatePagination,
  validateRequest,
  messageController.getConversation
);

/**
 * @swagger
 * /messages/conversation/{userId}/read:
 *   patch:
 *     summary: Marcar mensajes de una conversación como leídos
 *     description: >
 *       Marca como leídos todos los mensajes no leídos enviados por `userId`
 *       al usuario autenticado.
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del remitente cuyos mensajes se marcarán como leídos
 *     responses:
 *       200:
 *         description: Mensajes marcados como leídos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 updated:
 *                   type: integer
 *                   description: Número de mensajes actualizados
 *                 message:
 *                   type: string
 *       401:
 *         description: No autenticado
 */
router.patch(
  '/conversation/:userId/read',
  messageController.validateUserId,
  validateRequest,
  messageController.markConversationRead
);

/**
 * @swagger
 * components:
 *   schemas:
 *     DirectMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         senderId:
 *           type: integer
 *           example: 10
 *         receiverId:
 *           type: integer
 *           example: 42
 *         content:
 *           type: string
 *           example: "Hola, me gustaría contactarte sobre tu postulación."
 *         isRead:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *     Participant:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         role:
 *           type: string
 *           enum: [student, company]
 *         displayName:
 *           type: string
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *     Conversation:
 *       type: object
 *       properties:
 *         otherUser:
 *           $ref: '#/components/schemas/Participant'
 *         lastMessage:
 *           $ref: '#/components/schemas/DirectMessage'
 *         unreadCount:
 *           type: integer
 *           example: 2
 *     Pagination:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         limit:
 *           type: integer
 *         offset:
 *           type: integer
 */


/**
 * @swagger
 * /messages/users/search:
 *   get:
 *     summary: Buscar usuarios para iniciar conversaciones (HU-26)
 *     description: >
 *       Busca usuarios (estudiantes y empresas) por nombre o email.
 *       Permite a reclutadores encontrar candidatos para contactarlos (HU-24)
 *       y a estudiantes encontrar contactos de su red (HU-26).
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Texto de busqueda (nombre o email, min. 2 caracteres)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 20
 *     responses:
 *       200:
 *         description: Lista de participantes encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Participant'
 */
router.get(
  '/users/search',
  messageController.validateSearchQuery,
  validateRequest,
  messageController.searchUsers
);

module.exports = router;
