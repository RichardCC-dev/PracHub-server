const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertHistory = sequelize.define(
  'AlertHistory',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id',
      references: { model: 'Students', key: 'id' },
    },
    offerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'offer_id',
      references: { model: 'Offers', key: 'id' },
    },
    compatibilityScore: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'compatibility_score',
    },
    channel: {
      type: DataTypes.ENUM('email', 'platform', 'both'),
      allowNull: false,
    },
    isFromFollowedCompany: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_from_followed_company',
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'sent_at',
    },
    emailSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_sent_at',
    },
    notificationSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'notification_sent_at',
    },
    wasIncludedInDigest: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'was_included_in_digest',
    },
    digestType: {
      type: DataTypes.ENUM('daily', 'weekly'),
      allowNull: true,
      field: 'digest_type',
    },
  },
  {
    tableName: 'alert_history',
    timestamps: false,
    indexes: [
      {
        fields: ['student_id', 'offer_id'],
      },
      {
        fields: ['student_id', 'sent_at'],
      },
      {
        fields: ['offer_id'],
      },
    ],
  }
);

module.exports = AlertHistory;
