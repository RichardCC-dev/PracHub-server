const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ResumeVersion = sequelize.define(
  'ResumeVersion',
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
    },
    profile: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    personal: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    education: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    experience: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    languages: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    projects: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    certifications: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    completionPercentage: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'completion_percentage',
    },
    template: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pdfUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'pdf_url',
    },
  },
  {
    tableName: 'ResumeVersions',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
  },
);

module.exports = ResumeVersion;
