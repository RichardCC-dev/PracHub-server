const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Simulation = sequelize.define('Simulation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
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
  simulatedRole: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  career: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sector: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  overallScore: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  aiFeedbackSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'completed'),
    defaultValue: 'in_progress',
    allowNull: false,
  },
  chatHistory: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },
}, {
  tableName: 'Simulations',
  timestamps: true,
});

module.exports = Simulation;
