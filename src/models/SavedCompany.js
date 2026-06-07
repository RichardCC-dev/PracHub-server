const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SavedCompany = sequelize.define(
  'SavedCompany',
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
    companyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'company_id',
      references: { model: 'Companies', key: 'id' },
    },
    followedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'followed_at',
    },
    notificationsEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'notifications_enabled',
    },
  },
  {
    tableName: 'saved_companies',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['student_id', 'company_id'],
      },
    ],
  }
);

module.exports = SavedCompany;
