const {
  InvitationToApply,
  DirectMessage,
  Offer,
  Student,
  Application,
  Resume,
} = require('../models');
const { Op } = require('sequelize');

/**
 * Service: Lógica de negocio para invitaciones a postular (HU-18)
 * Responsable de validaciones y operaciones en BD
 */
const invitationService = {
  /**
   * Crear invitación a postular
   * Precondiciones:
   *  - recruiterId es de rol 'company'
   *  - offerId existe y pertenece a la company del reclutador
   *  - studentId existe y es de rol 'student'
   *  - No existe invitación pendiente/aceptada duplicada
   *
   * @param {number} recruiterId - ID del user reclutador
   * @param {number} studentId - ID del student candidato
   * @param {number} offerId - ID de la oferta
   * @param {string} recruiterMessage - Mensaje personalizado (max 300)
   * @returns {Promise<object>} { invitation, message }
   */
  async createInvitation(recruiterId, studentId, offerId, recruiterMessage) {
    try {
      // 1. Validar que la oferta existe y pertenece al reclutador
      const offer = await Offer.findByPk(offerId, {
        include: [{ association: 'company', attributes: ['userId'] }],
      });

      if (!offer) {
        throw new Error(`Offer ${offerId} not found`);
      }

      if (offer.company.userId !== recruiterId) {
        throw new Error('Unauthorized: offer does not belong to recruiter');
      }

      // 2. Validar que la oferta está activa
      if (offer.status !== 'active') {
        throw new Error('Offer is not active');
      }

      // 3. Validar que el estudiante existe
      const student = await Student.findByPk(studentId, {
        include: [{ association: 'user', attributes: ['id'] }],
      });

      if (!student) {
        throw new Error(`Student ${studentId} not found`);
      }

      // 4. Validar que no existe invitación duplicada (pendiente o aceptada)
      const existingInvitation = await InvitationToApply.findOne({
        where: {
          studentId,
          offerId,
          responseStatus: {
            [Op.in]: ['PENDING', 'ACCEPTED'],
          },
        },
      });

      if (existingInvitation) {
        throw new Error('Invitation already exists for this student-offer pair');
      }

      // 5. Validar que no ha aplicado ya
      const existingApplication = await Application.findOne({
        where: { studentId, offerId },
      });

      if (existingApplication) {
        throw new Error('Student has already applied to this offer');
      }

      // 6. Sanitizar y validar mensaje
      const sanitizedMessage = (recruiterMessage || '').trim().substring(0, 300);

      // 7. Crear DirectMessage
      const directMessage = await DirectMessage.create({
        senderId: recruiterId,
        receiverId: student.user.id,
        content: `💼 Invitation to apply: ${offer.title}\n\n${sanitizedMessage}`,
        isRead: false,
      });

      // 8. Crear InvitationToApply vinculada al mensaje
      const invitation = await InvitationToApply.create({
        messageId: directMessage.id,
        offerId,
        studentId,
        recruiterMessage: sanitizedMessage,
        responseStatus: 'PENDING',
      });

      return {
        invitation,
        message: directMessage,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Listar invitaciones pendientes de un estudiante
   * @param {number} studentId - ID del estudiante
   * @param {string} status - PENDING | ACCEPTED | DECLINED (default: PENDING)
   * @returns {Promise<array>} Array de invitaciones con detalles de oferta
   */
  async getInvitations(studentId, status = 'PENDING') {
    try {
      const invitations = await InvitationToApply.findAll({
        where: {
          studentId,
          ...(status && { responseStatus: status }),
        },
        include: [
          {
            association: 'offer',
            attributes: ['id', 'title', 'description', 'modality', 'companyId'],
            include: [
              {
                association: 'company',
                attributes: ['id', 'legalName', 'logoUrl'],
              },
            ],
          },
          {
            association: 'message',
            attributes: { exclude: ['updatedAt', 'isRead'] },
            include: [
              {
                association: 'sender',
                attributes: ['id', 'email'],
              },
            ],
          },
        ],
        order: [['created_at', 'DESC']],
      });

      return invitations;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Responder a una invitación (aceptar o declinar)
   * Si acepta: crea Application automáticamente
   *
   * @param {number} invitationId - ID de la invitación
   * @param {number} studentId - ID del estudiante (validación)
   * @param {string} response - ACCEPTED | DECLINED
   * @returns {Promise<object>} { invitation, application } (si acepta) o { invitation }
   */
  async respondToInvitation(invitationId, studentId, response) {
    try {
      // 1. Validar que la invitación existe y pertenece al estudiante
      const invitation = await InvitationToApply.findByPk(invitationId, {
        include: [
          { association: 'offer', attributes: ['id', 'companyId'] },
          { association: 'student', attributes: ['id', 'userId'] },
        ],
      });

      if (!invitation) {
        throw new Error(`Invitation ${invitationId} not found`);
      }

      if (invitation.studentId !== studentId) {
        throw new Error('Unauthorized: invitation does not belong to student');
      }

      if (invitation.responseStatus !== 'PENDING') {
        throw new Error('Invitation has already been responded to');
      }

      // 2. Validar respuesta
      if (!['ACCEPTED', 'DECLINED'].includes(response)) {
        throw new Error('Invalid response status');
      }

      // 3. Actualizar invitación
      invitation.responseStatus = response;
      invitation.respondedAt = new Date();
      await invitation.save();

      // 4. Si acepta: crear Application automáticamente
      if (response === 'ACCEPTED') {
        // Obtener CV activo del estudiante
        const resume = await Resume.findOne({
          where: { studentId },
          order: [['created_at', 'DESC']],
        });

        if (!resume) {
          throw new Error('Student has no active resume');
        }

        // Crear application
        const application = await Application.create({
          studentId,
          offerId: invitation.offerId,
          resumeId: resume.id,
          status: 'sent',
        });

        return {
          invitation,
          application,
        };
      }

      return {
        invitation,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verificar si existe invitación duplicada activa
   * @param {number} studentId
   * @param {number} offerId
   * @returns {Promise<boolean>}
   */
  async checkDuplicateInvitation(studentId, offerId) {
    try {
      const invitation = await InvitationToApply.findOne({
        where: {
          studentId,
          offerId,
          responseStatus: {
            [Op.in]: ['PENDING', 'ACCEPTED'],
          },
        },
      });

      return !!invitation;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener estadísticas de invitaciones para una oferta
   * (útil para dashboard de reclutador)
   * @param {number} offerId
   * @returns {Promise<object>} { total, accepted, declined, pending }
   */
  async getInvitationStats(offerId) {
    try {
      const stats = await InvitationToApply.findAll({
        attributes: ['responseStatus'],
        where: { offerId },
        raw: true,
      });

      return {
        total: stats.length,
        accepted: stats.filter(s => s.responseStatus === 'ACCEPTED').length,
        declined: stats.filter(s => s.responseStatus === 'DECLINED').length,
        pending: stats.filter(s => s.responseStatus === 'PENDING').length,
      };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = invitationService;
