const notificationService = require('../services/notificationService');

const notificationController = {
  async getMyNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const notifications = await notificationService.getUserNotifications(userId);
      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await notificationService.getUnreadCount(userId);
      res.json({ success: true, count });
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      const notification = await notificationService.markAsRead(notificationId, userId);
      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      await notificationService.markAllAsRead(userId);
      res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = notificationController;
