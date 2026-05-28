const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Application = sequelize.define(
  'Application',
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
      references: {
        model: 'Students',
        key: 'id',
      },
    },
    offerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'offer_id',
      references: {
        model: 'offers',
        key: 'id',
      },
    },
    resumeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'resume_id',
      references: {
        model: 'Resumes',
        key: 'id',
      },
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'cover_letter',
    },
    status: {
      type: DataTypes.ENUM('enviada', 'revision', 'descartada', 'aceptada'),
      allowNull: false,
      defaultValue: 'enviada',
    },
    appliedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'applied_at',
    },
    companyResponseAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'company_response_at',
    },
    companyNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'company_notes',
    },
    internalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'internal_notes',
    },
  },
  {
    tableName: 'applications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['student_id', 'offer_id'],
        name: 'unique_student_offer_application',
      },
    ],
  },
);

module.exports = Application;
