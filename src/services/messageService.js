const { DirectMessage, User, Student, Company } = require('../models');
const { Op } = require('sequelize');

/**
 * Atributos públicos que se exponen del usuario participante en una conversación.
 * No incluye passwordHash ni datos sensibles.
 */
const PUBLIC_USER_ATTRS = ['id', 'email', 'role'];

/**
 * Construye los atributos de include para obtener el perfil visible de un User.
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

      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversationMap.get(otherId);
        conv.unreadCount += 1;
        conversationMap.set(otherId, conv);
      }
    });

    return Array.from(conversationMap.values());
  },

  /**
   * Devuelve el historial completo de mensajes entre userId y otherUserId.
   */
  async getConversation(userId, otherUserId, options = {}) {
    const { limit = 50, offset = 0 } = options;

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

  /**
   * Busca usuarios del sistema por nombre o email para iniciar conversaciones (HU-26).
   * Solo devuelve usuarios con rol student o company (no admin).
   * Excluye al propio usuario.
   * @param {number} currentUserId - ID del usuario que busca
   * @param {string} query - Texto a buscar (mín. 2 caracteres)
   * @param {number} limit - Máximo de resultados
   */
  async searchUsers(currentUserId, query, limit = 10) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: currentUserId },
        role: { [Op.in]: ['student', 'company'] },
      },
      attributes: PUBLIC_USER_ATTRS,
      include: [
        {
          model: Student,
          as: 'studentProfile',
          attributes: ['firstName', 'lastName', 'profilePictureUrl', 'career'],
          required: false,
        },
        {
          model: Company,
          as: 'companyProfile',
          attributes: ['legalName', 'tradeName', 'logoUrl'],
          required: false,
        },
      ],
      limit,
    });

    const q = query.trim().toLowerCase();
    return users
      .filter((u) => {
        const s = u.studentProfile;
        const c = u.companyProfile;
        const name = s
          ? `${s.firstName} ${s.lastName}`.toLowerCase()
          : (c?.tradeName || c?.legalName || '').toLowerCase();
        return name.includes(q) || u.email.toLowerCase().includes(q);
      })
      .map(formatParticipant);
  },
};

module.exports = messageService;
