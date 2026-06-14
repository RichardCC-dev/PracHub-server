const { body, param, query } = require('express-validator');
const messageService = require('../services/messageService');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

const messageController = {
  /**
   * POST /api/messages
   * Enviar un mensaje directo a otro usuario.
   * Accesible para roles: student, company.
   */
  async sendMessage(req, res, next) {
    try {
      const senderId = req.user.id;
      const { receiverId, content } = req.body;

      const message = await messageService.sendMessage(
        senderId,
        parseInt(receiverId),
        content
      );

      // Notificar al receptor
      const senderName = req.user.studentProfile
        ? `${req.user.studentProfile.firstName} ${req.user.studentProfile.lastName}`
        : req.user.companyProfile?.tradeName ||
          req.user.companyProfile?.legalName ||
          req.user.email;

      await notificationService.createMessageNotification(
        parseInt(receiverId),
        senderName,
        content
      );

      logger.info(`[Messages] Mensaje enviado de userId=${senderId} a userId=${receiverId}`);

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
};

module.exports = messageController;
