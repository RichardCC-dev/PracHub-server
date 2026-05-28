const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id',
      references: { model: 'Users', key: 'id' },
    },
    type: {
      type: DataTypes.ENUM('status_change', 'application_received', 'offer_approved', 'offer_rejected'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read',
    },
    relatedId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'related_id',
    },
  },
  {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Notification;
