const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CVAnalysis = sequelize.define(
  'CVAnalysis',
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
        model: 'students',
        key: 'id',
      },
    },
    resumeId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'resume_id',
      references: {
        model: 'resumes',
        key: 'id',
      },
    },
    offerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'offer_id',
      references: {
        model: 'offers',
        key: 'id',
      },
    },
    overallScore: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'overall_score',
      validate: {
        min: 0,
        max: 100,
      },
    },
    sectionScores: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'section_scores',
    },
    observations: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    recommendations: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    keywordsAnalysis: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'keywords_analysis',
    },
    improvedCv: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'improved_cv',
    },
  },
  {
    tableName: 'cv_analyses',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = CVAnalysis;
