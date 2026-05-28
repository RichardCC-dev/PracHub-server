const { Notification } = require('../models');

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

const notificationService = {
  async createStatusChangeNotification(userId, applicationId, offerTitle, newStatus, notes = null) {
    const config = STATUS_MESSAGES[newStatus];
    if (!config) return;

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
      where: { userId },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
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
      where: { userId, isRead: false },
    });
  },
};

module.exports = notificationService;
