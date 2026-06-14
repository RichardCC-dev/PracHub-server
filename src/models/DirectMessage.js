const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modelo DirectMessage — HU-24, HU-25, HU-26
 *
 * Representa un mensaje directo entre dos usuarios del sistema.
 * Un "hilo de conversación" se infiere agrupando los mensajes
 * por el par (sender_id, receiver_id).
 *
 * Roles soportados:
 *  - company → student  (HU-24: reclutador a candidato)
 *  - student → company  (HU-25: respuesta desde bandeja de entrada)
 *  - student → student  (HU-26: networking, solo respuestas)
 */
const DirectMessage = sequelize.define(
  'DirectMessage',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    senderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'sender_id',
      references: { model: 'Users', key: 'id' },
    },
    receiverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'receiver_id',
      references: { model: 'Users', key: 'id' },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000],
      },
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_read',
    },
  },
  {
    tableName: 'direct_messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['sender_id'] },
      { fields: ['receiver_id'] },
      { fields: ['receiver_id', 'is_read'] },
    ],
  }
);

module.exports = DirectMessage;
