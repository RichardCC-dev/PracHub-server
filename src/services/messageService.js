const { DirectMessage, User, Student, Company, Application, Offer } = require('../models');
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
      attributes: ['id', 'firstName', 'lastName', 'profilePictureUrl'],
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
    studentId: s?.id,
    role: user.role,
    email: user.email,
    displayName: s
      ? `${s.firstName} ${s.lastName}`
      : c?.tradeName || c?.legalName || user.email,
    avatarUrl: s?.profilePictureUrl || c?.logoUrl || null,
  };
};

const httpError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

const messageService = {
  /**
   * Verifica que un estudiante haya postulado a alguna oferta de la empresa.
   */
  async studentAppliedToCompany(studentId, companyId) {
    const applied = await Application.findOne({
      where: { studentId },
      include: [{ model: Offer, as: 'offer', where: { companyId }, required: true, attributes: ['id'] }],
    });
    return !!applied;
  },

  /**
   * Aplica las reglas de mensajería:
   *  - La empresa solo puede iniciar conversación con candidatos que postularon a sus ofertas.
   *  - El estudiante solo puede responder a una empresa que ya le escribió primero.
   *  - No se permite chat estudiante↔estudiante ni empresa↔empresa.
   * @param {object} sender - req.user (incluye role, studentProfile, companyProfile)
   * @param {object} receiver - User receptor (incluye studentProfile, companyProfile)
   */
  async assertCanSend(sender, receiver) {
    if (sender.role === 'student') {
      if (receiver.role !== 'company') {
        throw httpError('Solo puedes responder a reclutadores.', 403);
      }
      const incoming = await DirectMessage.findOne({
        where: { senderId: receiver.id, receiverId: sender.id },
      });
      if (!incoming) {
        throw httpError('Solo puedes responder cuando un reclutador te haya escrito primero.', 403);
      }
      return;
    }

    if (sender.role === 'company') {
      if (receiver.role !== 'student' || !receiver.studentProfile) {
        throw httpError('Solo puedes escribir a estudiantes candidatos.', 403);
      }
      // Permitir si ya existe conversación previa.
      const existing = await DirectMessage.findOne({
        where: {
          [Op.or]: [
            { senderId: sender.id, receiverId: receiver.id },
            { senderId: receiver.id, receiverId: sender.id },
          ],
        },
      });
      if (existing) return;

      const companyId = sender.companyProfile?.id;
      if (!companyId) {
        throw httpError('No tienes un perfil de empresa asociado.', 403);
      }
      const applied = await this.studentAppliedToCompany(receiver.studentProfile.id, companyId);
      if (!applied) {
        throw httpError('Solo puedes iniciar conversación con candidatos que postularon a tus ofertas.', 403);
      }
      return;
    }

    throw httpError('No estás autorizado para enviar mensajes.', 403);
  },

  /**
   * Envía un mensaje directo de sender (req.user) a receiverId, aplicando las reglas.
   */
  async sendMessage(sender, receiverId, content) {
    const emailService = require('./emailService');

    if (sender.id === receiverId) {
      throw httpError('No puedes enviarte mensajes a ti mismo.', 400);
    }

    const receiver = await User.findByPk(receiverId, {
      include: [
        { model: Student, as: 'studentProfile', required: false },
        { model: Company, as: 'companyProfile', required: false },
      ],
    });
    if (!receiver) {
      throw httpError('Usuario receptor no encontrado.', 404);
    }

    await this.assertCanSend(sender, receiver);

    const message = await DirectMessage.create({
      senderId: sender.id,
      receiverId,
      content: content.trim(),
      isRead: false,
    });

    // Enviar email transaccional (fire and forget)
    const senderName = sender.companyProfile ? (sender.companyProfile.tradeName || sender.companyProfile.legalName) :
                       (sender.studentProfile ? `${sender.studentProfile.firstName} ${sender.studentProfile.lastName}` : sender.email);
    const conversationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/inbox/${sender.id}`;
    
    emailService.sendNewMessageReceived({
      to: receiver.email,
      senderName,
      messagePreview: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      conversationUrl,
    }).catch(err => console.error('Error enviando email de nuevo mensaje:', err));

    // WhatsApp si el receptor es estudiante
    if (receiver.studentProfile) {
      const { AlertSettings } = require('../models');
      const whatsappService = require('./whatsappService');
      AlertSettings.findOne({ where: { studentId: receiver.studentProfile.id } }).then(settings => {
        if (settings?.whatsappEnabled && receiver.studentProfile.phoneNumber) {
           whatsappService.sendWhatsAppNotification(
             receiver.studentProfile.phoneNumber,
             `¡Hola ${receiver.studentProfile.firstName}! Tienes un nuevo mensaje de ${senderName}. Ingresa a PracHub para responder: ${conversationUrl}`
           ).catch(() => {});
        }
      }).catch(() => {});
    }

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
          attributes: ['id', 'firstName', 'lastName', 'profilePictureUrl'],
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
      throw httpError('Usuario no encontrado.', 404);
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
   * Busca candidatos para que una EMPRESA inicie conversación.
   * Solo las empresas pueden buscar, y únicamente entre estudiantes que
   * postularon a alguna de sus ofertas. Los estudiantes no pueden iniciar
   * conversaciones (solo responden), por lo que reciben una lista vacía.
   * @param {object} currentUser - req.user
   * @param {string} query - Texto a buscar
   * @param {number} limit - Máximo de resultados
   */
  async searchUsers(currentUser, query, limit = 10) {
    if (currentUser.role !== 'company' || !currentUser.companyProfile) {
      return [];
    }
    const companyId = currentUser.companyProfile.id;

    // IDs de estudiantes que postularon a ofertas de la empresa
    const applications = await Application.findAll({
      attributes: ['studentId'],
      include: [{ model: Offer, as: 'offer', where: { companyId }, required: true, attributes: [] }],
      group: ['studentId'],
    });
    const studentIds = applications.map((a) => a.studentId);
    if (studentIds.length === 0) return [];

    const students = await Student.findAll({
      where: { id: { [Op.in]: studentIds } },
      include: [{ model: User, as: 'user', attributes: PUBLIC_USER_ATTRS }],
      limit: 50,
    });

    const q = (query || '').trim().toLowerCase();
    return students
      .filter((s) => {
        if (q.length < 2) return true;
        const name = `${s.firstName} ${s.lastName}`.toLowerCase();
        return name.includes(q) || (s.user?.email || '').toLowerCase().includes(q);
      })
      .slice(0, limit)
      .map((s) => ({
        id: s.user?.id,
        role: 'student',
        email: s.user?.email,
        displayName: `${s.firstName} ${s.lastName}`.trim(),
        avatarUrl: s.profilePictureUrl || null,
      }))
      .filter((u) => u.id);
  },
};

module.exports = messageService;
