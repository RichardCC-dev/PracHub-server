const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modelo InvitationToApply — HU-18
 *
 * Representa una invitación directa a postular que envía un reclutador a un candidato.
 * Se vincula a un DirectMessage y a una Offer específica.
 *
 * Flujo:
 *  1. Reclutador selecciona candidato + oferta + mensaje (max 300 chars)
 *  2. Se crea DirectMessage + InvitationToApply (PENDING)
 *  3. Candidato recibe notificación + puede aceptar/declinar
 *  4. Si acepta → crea Application automáticamente
 *  5. Se actualiza response_status + responded_at
 */
const InvitationToApply = sequelize.define(
  'InvitationToApply',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    messageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'message_id',
      references: { model: 'direct_messages', key: 'id' },
      onDelete: 'CASCADE',
    },
    offerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'offer_id',
      references: { model: 'offers', key: 'id' },
      onDelete: 'CASCADE',
    },
    studentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'student_id',
      references: { model: 'Students', key: 'id' },
      onDelete: 'CASCADE',
    },
    recruiterMessage: {
      type: DataTypes.STRING(300),
      allowNull: true,
      field: 'recruiter_message',
      validate: {
        len: [0, 300],
      },
    },
    responseStatus: {
      type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'DECLINED'),
      allowNull: false,
      defaultValue: 'PENDING',
      field: 'response_status',
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'responded_at',
    },
  },
  {
    tableName: 'invitations_to_apply',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['student_id', 'response_status'] },
      { fields: ['offer_id'] },
      { fields: ['message_id'] },
    ],
    // Prevenir invitaciones duplicadas: un mensaje = una oferta
    uniqueKeys: {
      unique_invitation: {
        fields: ['message_id', 'offer_id'],
      },
    },
  }
);

module.exports = InvitationToApply;
