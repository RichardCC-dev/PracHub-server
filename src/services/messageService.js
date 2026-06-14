const { DirectMessage, User, Student, Company } = require('../models');
const { Op } = require('sequelize');

/**
 * Atributos públicos que se exponen del usuario participante en una conversación.
 * No incluye passwordHash ni datos sensibles.
 */
const PUBLIC_USER_ATTRS = ['id', 'email', 'role'];

/**
 * Construye los atributos de include para obtener el perfil visible de un User.
 * Dependiendo del rol devuelve el nombre desde studentProfile o companyProfile.
 */
const userInclude = (alias) => ({
  model: User,
  as: alias,
  attributes: PUBLIC_USER_ATTRS,
  include: [
    {
      model: Student,
      as: 'studentProfile',
      attributes: ['firstName', 'lastName', 'profilePictureUrl'],
      required: false,
    },
    {
      model: Company,
      as: 'companyProfile',
      attributes: ['legalName', 'tradeName', 'logoUrl'],
      required: false,
    },
  ],
});

/**
 * Formatea el objeto User en un resumen legible para el frontend.
 */
const formatParticipant = (user) => {
  if (!user) return null;
  const s = user.studentProfile;
  const c = user.companyProfile;
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    displayName: s
      ? `${s.firstName} ${s.lastName}`
      : c?.tradeName || c?.legalName || user.email,
    avatarUrl: s?.profilePictureUrl || c?.logoUrl || null,
  };
};

const messageService = {
  /**
   * Envía un mensaje directo de senderId a receiverId.
   * Valida que el receptor exista.
   */
  async sendMessage(senderId, receiverId, content) {
    if (senderId === receiverId) {
      throw new Error('No puedes enviarte mensajes a ti mismo.');
    }

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      throw new Error('Usuario receptor no encontrado.');
    }

    const message = await DirectMessage.create({
      senderId,
      receiverId,
      content: content.trim(),
      isRead: false,
    });

    return message;
  },

  /**
   * Devuelve la lista de conversaciones activas del usuario:
   * agrupa por el otro participante y muestra el último mensaje + unread count.
   */
  async getConversations(userId) {
    // Obtener todos los mensajes donde el usuario es sender o receiver
    const messages = await DirectMessage.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      include: [
        userInclude('sender'),
        userInclude('receiver'),
      ],
      order: [['created_at', 'DESC']],
    });

    // Agrupar por conversación (par de usuarios únicos)
    const conversationMap = new Map();

    messages.forEach((msg) => {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          otherUser: formatParticipant(otherUser),
          lastMessage: {
            id: msg.id,
            content: msg.content,
            senderId: msg.senderId,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
          },
          unreadCount: 0,
        });
      }

      // Contar mensajes no leídos recibidos
      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversationMap.get(otherId);
        conv.unreadCount += 1;
        conversationMap.set(otherId, conv);
      }
    });

    return Array.from(conversationMap.values());
  },

  /**
   * Devuelve el historial completo de mensajes entre userId y otherUserId,
   * ordenados cronológicamente.
   */
  async getConversation(userId, otherUserId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    // Verificar que el otro usuario exista
    const otherUser = await User.findByPk(otherUserId, {
      attributes: PUBLIC_USER_ATTRS,
      include: [
        {
          model: Student,
          as: 'studentProfile',
          attributes: ['firstName', 'lastName', 'profilePictureUrl'],
          required: false,
        },
        {
          model: Company,
          as: 'companyProfile',
          attributes: ['legalName', 'tradeName', 'logoUrl'],
          required: false,
        },
      ],
    });

    if (!otherUser) {
      throw new Error('Usuario no encontrado.');
    }

    const { count, rows } = await DirectMessage.findAndCountAll({
      where: {
        [Op.or]: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      order: [['created_at', 'ASC']],
      limit,
      offset,
    });

    return {
      otherUser: formatParticipant(otherUser),
      messages: rows,
      pagination: { total: count, limit, offset },
    };
  },

  /**
   * Marca como leídos todos los mensajes recibidos del usuario otherUserId.
   */
  async markConversationAsRead(userId, otherUserId) {
    const [updated] = await DirectMessage.update(
      { isRead: true },
      {
        where: {
          senderId: otherUserId,
          receiverId: userId,
          isRead: false,
        },
      }
    );
    return { updated };
  },

  /**
   * Devuelve el total de mensajes no leídos recibidos por userId.
   */
  async getUnreadMessageCount(userId) {
    return await DirectMessage.count({
      where: { receiverId: userId, isRead: false },
    });
  },
};

module.exports = messageService;
