const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Importa la conexión directamente

const EmailVerificationToken = sequelize.define('EmailVerificationToken', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED, // OJO: Lo cambié de UUID a INTEGER para que coincida con User.id
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  tokenHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'email_verification_tokens',
  underscored: true,
  timestamps: true,
});

module.exports = EmailVerificationToken; // Exporta el modelo directamente