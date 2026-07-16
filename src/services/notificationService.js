const { Op } = require('sequelize');
const { Notification, Offer, Company, Application, Student } = require('../models');

const STATUS_MESSAGES = {
  revision: {
    title: 'Tu postulación está en revisión',
    message: (offerTitle) => `La empresa está evaluando tu postulación para "${offerTitle}". Te notificaremos cuando haya una respuesta.`,
  },
  aceptada: {
    title: '¡Felicitaciones! Tu postulación fue aceptada',
    message: (offerTitle) => `Has sido seleccionado para la práctica "${offerTitle}". La empresa se pondrá en contacto contigo pronto.`,
  },
  descartada: {
    title: 'Tu postulación no fue seleccionada',
    message: (offerTitle, notes) => notes
      ? `Tu postulación para "${offerTitle}" no fue seleccionada. Mensaje de la empresa: "${notes}"`
      : `Tu postulación para "${offerTitle}" no fue seleccionada en esta oportunidad.`,
  },
};

// Las notificaciones de la campana son SOLO sobre empleos.
// Los mensajes directos NO generan notificación: su conteo se muestra en el ícono de Mensajes.
const NON_JOB_TYPES = ['message_received'];

const notificationService = {
  async createStatusChangeNotification(userId, applicationId, offerTitle, newStatus, notes = null) {
    const config = STATUS_MESSAGES[newStatus];
    if (!config) return;

    // Deduplicación: no crear si ya existe una notificación del mismo tipo
    // para la misma postulación y mismo estado (evita duplicados por doble llamada)
    const existing = await Notification.findOne({
      where: { userId, type: 'status_change', relatedId: applicationId, title: config.title },
    });
    if (existing) return;

    await Notification.create({
      userId,
      type: 'status_change',
      title: config.title,
      message: config.message(offerTitle, notes),
      isRead: false,
      relatedId: applicationId,
    });
  },

  async getUserNotifications(userId) {
    return await Notification.findAll({
      where: { userId, type: { [Op.notIn]: NON_JOB_TYPES } },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
  },

  async getNotificationById(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) return null;

    // Enriquecer con información adicional según el tipo
    const detail = {
      ...notification.toJSON(),
      extra: null,
    };

    try {
      if (notification.type === 'offer_match' || notification.type === 'followed_company_offer') {
        // relatedId = offerId → traer info de la oferta y empresa
        const offer = await Offer.findByPk(notification.relatedId, {
          include: [{ model: Company, as: 'company', attributes: ['id', 'legalName', 'tradeName', 'logoUrl'] }],
          attributes: ['id', 'title', 'area', 'modality', 'duration', 'compensation', 'status', 'expiresAt'],
        });
        if (offer) {
          detail.extra = {
            kind: 'offer',
            offer: offer.toJSON(),
          };
        }
      } else if (notification.type === 'status_change') {
        // relatedId = applicationId → traer info de la postulación
        const application = await Application.findByPk(notification.relatedId, {
          include: [
            { model: Offer, as: 'offer', attributes: ['id', 'title', 'area', 'modality'] },
            { model: Company, as: 'company', attributes: ['id', 'legalName', 'tradeName'] },
          ],
          attributes: ['id', 'status', 'createdAt'],
        });
        if (application) {
          detail.extra = {
            kind: 'application',
            application: application.toJSON(),
          };
        }
      } else if (notification.type === 'application_received') {
        // relatedId = applicationId (para empresa)
        const application = await Application.findByPk(notification.relatedId, {
          include: [
            { model: Offer, as: 'offer', attributes: ['id', 'title'] },
            { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName', 'career'] },
          ],
          attributes: ['id', 'status', 'createdAt'],
        });
        if (application) {
          detail.extra = {
            kind: 'application_received',
            application: application.toJSON(),
          };
        }
      }
    } catch {
      // Si falla el enriquecimiento, devolver la notificación sin extra
    }

    return detail;
  },

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) throw new Error('Notificación no encontrada');
    notification.isRead = true;
    await notification.save();
    return notification;
  },

  async markAllAsRead(userId) {
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
  },

  async getUnreadCount(userId) {
    return await Notification.count({
      where: { userId, isRead: false, type: { [Op.notIn]: NON_JOB_TYPES } },
    });
  },
};

module.exports = notificationService;
