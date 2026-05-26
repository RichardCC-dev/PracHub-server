const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Offer = sequelize.define(
  'Offer',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    companyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'company_id',
      references: {
        model: 'companies',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    careerTags: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'career_tags',
    },
    modality: {
      type: DataTypes.ENUM('remote', 'in_person', 'hybrid'),
      allowNull: false,
      defaultValue: 'in_person',
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    compensation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
    // Campos de moderación
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'closed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    moderatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'moderated_at',
    },
    moderatedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'moderated_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
    },
  },
  {
    tableName: 'offers',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Offer;
