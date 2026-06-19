const { body, param, query } = require('express-validator');
const messageService = require('../services/messageService');
const logger = require('../utils/logger');

const messageController = {
  /**
   * POST /api/messages
   * Enviar un mensaje directo a otro usuario.
   * Reglas aplicadas en el servicio: la empresa solo inicia con candidatos que
   * postularon; el estudiante solo responde; sin chat estudiante↔estudiante.
   */
  async sendMessage(req, res, next) {
    try {
      const { receiverId, content } = req.body;

      const message = await messageService.sendMessage(
        req.user,
        parseInt(receiverId),
        content
      );

      // Nota: NO se crea notificación de mensaje. Las notificaciones son solo de empleos.
      // El conteo de mensajes no leídos se muestra en el ícono de Mensajes (badge).

      logger.info(`[Messages] Mensaje enviado de userId=${req.user.id} a userId=${receiverId}`);

      res.status(201).json({
        success: true,
        data: message,
        message: 'Mensaje enviado exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/messages/inbox
   * Obtener la lista de conversaciones activas del usuario autenticado.
   */
  async getInbox(req, res, next) {
    try {
      const userId = req.user.id;
      const conversations = await messageService.getConversations(userId);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/messages/unread-count
   * Obtener el conteo de mensajes no leídos del usuario autenticado.
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await messageService.getUnreadMessageCount(userId);

      res.json({ success: true, count });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/messages/conversation/:userId
   * Obtener el historial de mensajes con un usuario específico.
   */
  async getConversation(req, res, next) {
    try {
      const userId = req.user.id;
      const otherUserId = parseInt(req.params.userId);
      const { limit = 50, offset = 0 } = req.query;

      const result = await messageService.getConversation(userId, otherUserId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/messages/conversation/:userId/read
   * Marcar como leídos todos los mensajes recibidos de un usuario.
   */
  async markConversationRead(req, res, next) {
    try {
      const userId = req.user.id;
      const otherUserId = parseInt(req.params.userId);

      const result = await messageService.markConversationAsRead(userId, otherUserId);

      res.json({
        success: true,
        ...result,
        message: 'Mensajes marcados como leídos.',
      });
    } catch (error) {
      next(error);
    }
  },

  // ── Validaciones ──────────────────────────────────────────────────────────

  validateSendMessage: [
    body('receiverId')
      .isInt({ min: 1 })
      .withMessage('receiverId debe ser un entero positivo.'),
    body('content')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('El contenido del mensaje no puede estar vacío.')
      .isLength({ max: 2000 })
      .withMessage('El mensaje no puede superar los 2000 caracteres.'),
  ],

  validateUserId: [
    param('userId')
      .isInt({ min: 1 })
      .withMessage('userId inválido.'),
  ],

  validatePagination: [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],

  /**
   * GET /api/messages/users/search?q=...
   * Buscar candidatos para iniciar conversación. Solo disponible para empresas
   * (entre sus candidatos). Los estudiantes reciben lista vacía.
   */
  async searchUsers(req, res, next) {
    try {
      const { q = '', limit = 10 } = req.query;
      const users = await messageService.searchUsers(req.user, q, parseInt(limit));
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  },

  validateSearchQuery: [
    query('q')
      .optional()
      .isString()
      .isLength({ max: 100 })
      .withMessage('La busqueda no puede superar 100 caracteres.'),
    query('limit').optional().isInt({ min: 1, max: 20 }),
  ],
};

module.exports = messageController;
