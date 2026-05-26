const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define(
  'Company',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    taxId: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      field: 'tax_id',
      comment: 'RUC, NIT o identificación fiscal del país',
    },
    legalName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'legal_name',
    },
    tradeName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'trade_name',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    companySize: {
      type: DataTypes.ENUM('micro', 'small', 'medium', 'large'),
      allowNull: false,
      field: 'company_size',
    },
    websiteUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'website_url',
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'logo_url',
    },
    cultureTags: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'culture_tags',
      defaultValue: [],
      comment: 'Array de hasta 3 etiquetas de cultura organizacional',
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Perú',
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    responsibleName: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: 'responsible_name',
    },
    responsiblePosition: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'responsible_position',
    },
    responsiblePhone: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'responsible_phone',
    },
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
      field: 'verification_status',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_verified',
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at',
    },
    canPublishOffers: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'can_publish_offers',
    },
    pendingOffersCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'pending_offers_count',
    },
  },
  {
    tableName: 'Companies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
);

module.exports = Company;
