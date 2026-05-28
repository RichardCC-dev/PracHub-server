const express = require('express');
const { param } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const authenticate = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.getMyNotifications);

router.get('/unread-count', notificationController.getUnreadCount);

router.patch('/read-all', notificationController.markAllAsRead);

router.patch(
  '/:notificationId/read',
  [param('notificationId').isInt({ min: 1 }), validateRequest],
  notificationController.markAsRead
);

module.exports = router;
