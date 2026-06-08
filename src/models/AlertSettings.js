const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AlertSettings = sequelize.define(
  'AlertSettings',
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
      unique: true,
    },
    frequency: {
      type: DataTypes.ENUM('immediate', 'daily', 'weekly'),
      allowNull: false,
      defaultValue: 'immediate',
    },
    emailEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'email_enabled',
    },
    platformEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'platform_enabled',
    },
    dailyDigestTime: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: '09:00:00',
      field: 'daily_digest_time',
    },
    weeklyDigestDay: {
      type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      allowNull: true,
      defaultValue: 'monday',
      field: 'weekly_digest_day',
    },
  },
  {
    tableName: 'alert_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = AlertSettings;
