const { validationResult } = require('express-validator');
const invitationService = require('../services/invitationService');
const { Offer } = require('../models');
const logger = require('../utils/logger');

/**
 * Controller: Manejo HTTP de invitaciones a postular (HU-18)
 * Responsable de validar entrada, llamar service, y retornar respuestas
 */
const invitationController = {
  /**
   * POST /api/invitations/send
   * Enviar invitación a postular a un candidato
   *
   * Body:
   * {
   *   studentId: number,
   *   offerId: number,
   *   recruiterMessage: string (max 300)
   * }
   *
   * Respuesta: 201 { invitation, message }
   */
  async sendInvitation(req, res) {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { studentId, offerId, recruiterMessage } = req.body;
      const recruiterId = req.user.id; // Del JWT

      logger.info(
        `[Invitation] Recruiter ${recruiterId} sending invitation to student ${studentId} for offer ${offerId}`
      );

      // Llamar service
      const result = await invitationService.createInvitation(
        recruiterId,
        studentId,
        offerId,
        recruiterMessage
      );

      logger.info(
        `[Invitation] Invitation ${result.invitation.id} created successfully`
      );

      return res.status(201).json({
        success: true,
        data: {
          invitation: result.invitation,
          message: result.message,
        },
        message: 'Invitation sent successfully',
      });
    } catch (error) {
      logger.error(`[Invitation] sendInvitation error: ${error.message}`);

      // Errores específicos
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('already')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error sending invitation',
        error: error.message,
      });
    }
  },

  /**
   * GET /api/invitations
   * Listar invitaciones del estudiante actual
   *
   * Query params:
   * - status: PENDING | ACCEPTED | DECLINED (default: PENDING)
   *
   * Respuesta: 200 { invitations: [] }
   */
  async getInvitations(req, res) {
    try {
      const studentId = req.user.studentProfile?.id; // De la relación user-student
      const { status = 'PENDING' } = req.query;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'User is not a student',
        });
      }

      logger.info(
        `[Invitation] Fetching ${status} invitations for student ${studentId}`
      );

      const invitations = await invitationService.getInvitations(
        studentId,
        status
      );

      return res.status(200).json({
        success: true,
        data: { invitations },
        count: invitations.length,
      });
    } catch (error) {
      logger.error(`[Invitation] getInvitations error: ${error.message}`);

      return res.status(500).json({
        success: false,
        message: 'Error fetching invitations',
        error: error.message,
      });
    }
  },

  /**
   * POST /api/invitations/:id/respond
   * Responder a una invitación (aceptar o declinar)
   *
   * Body:
   * {
   *   response: "ACCEPTED" | "DECLINED"
   * }
   *
   * Respuesta: 200 { invitation, application? }
   */
  async respondToInvitation(req, res) {
    try {
      // Validar entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { response } = req.body;
      const studentId = req.user.studentProfile?.id; // De la relación user-student

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'User is not a student',
        });
      }

      logger.info(
        `[Invitation] Student ${studentId} responding to invitation ${id} with: ${response}`
      );

      // Llamar service
      const result = await invitationService.respondToInvitation(
        parseInt(id),
        studentId,
        response
      );

      logger.info(
        `[Invitation] Invitation ${id} responded with ${response}`
      );

      return res.status(200).json({
        success: true,
        data: result,
        message: `Invitation ${response.toLowerCase()} successfully`,
      });
    } catch (error) {
      logger.error(`[Invitation] respondToInvitation error: ${error.message}`);

      // Errores específicos
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('already been responded')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error responding to invitation',
        error: error.message,
      });
    }
  },

  /**
   * GET /api/invitations/stats/:offerId
   * Obtener estadísticas de invitaciones (para reclutador)
   * Solo el propietario de la oferta puede verla
   */
  async getInvitationStats(req, res) {
    try {
      const { offerId } = req.params;
      const companyId = req.user.companyProfile?.id; // De la relación user-company

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'User is not a company',
        });
      }

      // Validar que la oferta pertenece a la company
      const offer = await Offer.findByPk(offerId, {
        attributes: ['id', 'companyId'],
      });

      if (!offer || offer.companyId !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to view stats for this offer',
        });
      }

      logger.info(
        `[Invitation] Fetching stats for offer ${offerId}`
      );

      const stats = await invitationService.getInvitationStats(
        parseInt(offerId)
      );

      return res.status(200).json({
        success: true,
        data: { stats },
      });
    } catch (error) {
      logger.error(`[Invitation] getInvitationStats error: ${error.message}`);

      return res.status(500).json({
        success: false,
        message: 'Error fetching invitation stats',
        error: error.message,
      });
    }
  },
};

module.exports = invitationController;
