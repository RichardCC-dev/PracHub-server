const { Op } = require('sequelize');
const {
  AlertSettings,
  AlertHistory,
  SavedCompany,
  Notification,
  Student,
  User,
  Offer,
  Company,
  Resume,
} = require('../models');
const recommendationService = require('./recommendationService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

const THRESHOLD_COMPATIBILITY = recommendationService.COMPATIBILITY_THRESHOLD;

const alertService = {
  /**
   * Obtiene o crea la configuración de alertas de un estudiante
   */
  async getOrCreateSettings(studentId) {
    let settings = await AlertSettings.findOne({
      where: { studentId },
    });

    if (!settings) {
      settings = await AlertSettings.create({
        studentId,
        frequency: 'immediate',
        emailEnabled: true,
        platformEnabled: true,
        whatsappEnabled: false,
      });
    }

    return settings;
  },

  /**
   * Actualiza la configuración de alertas de un estudiante
   */
  async updateSettings(studentId, updateData) {
    const settings = await this.getOrCreateSettings(studentId);

    const allowedFields = [
      'frequency',
      'emailEnabled',
      'platformEnabled',
      'whatsappEnabled',
      'dailyDigestTime',
      'weeklyDigestDay',
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        settings[field] = updateData[field];
      }
    });

    await settings.save();
    return settings;
  },

  /**
   * Verifica si una oferta ya fue notificada a un estudiante
   */
  async wasOfferAlreadyAlerted(studentId, offerId) {
    const existingAlert = await AlertHistory.findOne({
      where: { studentId, offerId },
    });
    return !!existingAlert;
  },

  /**
   * Verifica si el estudiante sigue a la empresa de la oferta
   */
  async isCompanyFollowed(studentId, companyId) {
    const savedCompany = await SavedCompany.findOne({
      where: { studentId, companyId },
    });
    return !!savedCompany;
  },

  /**
   * Calcula la compatibilidad entre un estudiante y una oferta
   * Delega el cálculo a recommendationService para consistencia
   */
  async calculateCompatibility(studentId, offer) {
    return await recommendationService.calculateCompatibilityScore(studentId, offer);
  },

  /**
   * Envía una alerta inmediata a un estudiante sobre una oferta compatible
   */
  async sendImmediateAlert(studentId, offer, compatibilityScore, isFromFollowedCompany = false) {
    const settings = await this.getOrCreateSettings(studentId);

    // Verificar si ya fue alertado
    if (await this.wasOfferAlreadyAlerted(studentId, offer.id)) {
      return { sent: false, reason: 'already_alerted' };
    }

    // Verificar umbral mínimo de compatibilidad (fijo del sistema)
    if (compatibilityScore < THRESHOLD_COMPATIBILITY) {
      return { sent: false, reason: 'below_threshold' };
    }

    const student = await Student.findByPk(studentId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!student || !student.user) {
      return { sent: false, reason: 'student_not_found' };
    }

    const company = await Company.findByPk(offer.companyId);
    const alertData = {
      studentId,
      offerId: offer.id,
      compatibilityScore,
      isFromFollowedCompany,
    };

    let emailSent = false;
    let notificationSent = false;

    // Enviar notificación por email
    if (settings.emailEnabled) {
      try {
        await emailService.sendOfferMatchAlert({
          to: student.user.email,
          firstName: student.firstName,
          offerTitle: offer.title,
          companyName: company?.legalName || 'Empresa',
          isFromFollowedCompany,
          offerId: offer.id,
          compatibilityScore,
        });
        emailSent = true;
      } catch (error) {
        logger.error('Error enviando email de alerta:', error);
      }
    }

    // Enviar notificación en plataforma
    if (settings.platformEnabled) {
      try {
        const notificationType = isFromFollowedCompany
          ? 'followed_company_offer'
          : 'offer_match';
        const title = isFromFollowedCompany
          ? `¡${company?.legalName || 'Empresa'} publicó una oferta para ti!`
          : 'Nueva oferta compatible con tu perfil';
        const message = isFromFollowedCompany
          ? `"${offer.title}" - ${company?.legalName || 'Empresa'}. ¡Postula ahora!`
          : `"${offer.title}" - ${company?.legalName || 'Empresa'}. ¡Revisa esta oferta!`;

        // Verificar si ya existe una notificación idéntica (deduplicación)
        const existingNotif = await Notification.findOne({
          where: { userId: student.userId, type: notificationType, relatedId: offer.id },
        });
        if (!existingNotif) {
          await Notification.create({
            userId: student.userId,
            type: notificationType,
            title,
            message,
            isRead: false,
            relatedId: offer.id,
          });
          notificationSent = true;
        } else {
          notificationSent = true; // Ya fue notificado, contar como enviado
        }
      } catch (error) {
        logger.error('Error creando notificación en plataforma:', error);
      }
    }

    // Registrar en historial
    const alertHistory = await AlertHistory.create({
      ...alertData,
      channel: emailSent && notificationSent ? 'both' : emailSent ? 'email' : 'platform',
      emailSentAt: emailSent ? new Date() : null,
      notificationSentAt: notificationSent ? new Date() : null,
      wasIncludedInDigest: false,
    });

    return {
      sent: emailSent || notificationSent,
      emailSent,
      notificationSent,
      alertHistory,
    };
  },

  /**
   * Procesa una nueva oferta publicada y envía alertas a estudiantes compatibles
   * Este método se llama cuando una oferta es aprobada por el admin
   */
  async processNewOffer(offer) {
    try {
      // Obtener todos los estudiantes con CV activo
      const studentsWithResumes = await Student.findAll({
        include: [
          {
            model: Resume,
            as: 'resume',
            required: true,
          },
          {
            model: User,
            as: 'user',
            required: true,
          },
        ],
      });

      const results = {
        totalProcessed: 0,
        alertsSent: 0,
        errors: [],
      };

      for (const student of studentsWithResumes) {
        try {
          results.totalProcessed++;

          const settings = await this.getOrCreateSettings(student.id);

          // Solo procesar alertas inmediatas aquí
          if (settings.frequency !== 'immediate') {
            continue;
          }

          // Verificar si ya fue alertado
          if (await this.wasOfferAlreadyAlerted(student.id, offer.id)) {
            continue;
          }

          // Calcular compatibilidad
          const compatibilityScore = await this.calculateCompatibility(student.id, offer);

          // Verificar si sigue a la empresa
          const isFromFollowedCompany = await this.isCompanyFollowed(student.id, offer.companyId);

          // Enviar alerta si cumple criterios (umbral fijo del sistema)
          if (compatibilityScore >= THRESHOLD_COMPATIBILITY || isFromFollowedCompany) {
            const result = await this.sendImmediateAlert(
              student.id,
              offer,
              compatibilityScore,
              isFromFollowedCompany
            );
            if (result.sent) {
              results.alertsSent++;
            }
          }
        } catch (studentError) {
          logger.error(`Error procesando alerta para estudiante ${student.id}:`, studentError);
          results.errors.push({ studentId: student.id, error: studentError.message });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error procesando nueva oferta para alertas:', error);
      throw error;
    }
  },

  /**
   * Genera resumen diario de ofertas para estudiantes con frecuencia 'daily'
   */
  async generateDailyDigest() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Obtener estudiantes con configuración diaria
      const dailySettings = await AlertSettings.findAll({
        where: { frequency: 'daily', emailEnabled: true },
        include: [
          {
            model: Student,
            as: 'student',
            include: [{ model: User, as: 'user' }],
          },
        ],
      });

      const results = { processed: 0, emailsSent: 0, errors: [] };

      for (const setting of dailySettings) {
        try {
          results.processed++;

          // Obtener ofertas publicadas hoy que no hayan sido alertadas
          const unalertedOffers = await this.getUnalertedOffersForStudent(
            setting.studentId,
            today,
            THRESHOLD_COMPATIBILITY
          );

          if (unalertedOffers.length === 0) continue;

          // Enviar resumen por email
          await emailService.sendDailyDigest({
            to: setting.student.user.email,
            firstName: setting.student.firstName,
            offers: unalertedOffers,
          });

          // Registrar en historial
          for (const offerData of unalertedOffers) {
            await AlertHistory.create({
              studentId: setting.studentId,
              offerId: offerData.offer.id,
              compatibilityScore: offerData.compatibilityScore,
              isFromFollowedCompany: offerData.isFromFollowedCompany,
              channel: 'email',
              emailSentAt: new Date(),
              wasIncludedInDigest: true,
              digestType: 'daily',
            });
          }

          results.emailsSent++;
        } catch (error) {
          logger.error(`Error generando digest diario para estudiante ${setting.studentId}:`, error);
          results.errors.push({ studentId: setting.studentId, error: error.message });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error generando digest diario:', error);
      throw error;
    }
  },

  /**
   * Genera resumen semanal de ofertas para estudiantes con frecuencia 'weekly'
   */
  async generateWeeklyDigest() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const dayNameMap = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday',
    };
    const todayName = dayNameMap[dayOfWeek];

    try {
      // Obtener estudiantes con configuración semanal para hoy
      const weeklySettings = await AlertSettings.findAll({
        where: {
          frequency: 'weekly',
          emailEnabled: true,
          weeklyDigestDay: todayName,
        },
        include: [
          {
            model: Student,
            as: 'student',
            include: [{ model: User, as: 'user' }],
          },
        ],
      });

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const results = { processed: 0, emailsSent: 0, errors: [] };

      for (const setting of weeklySettings) {
        try {
          results.processed++;

          // Obtener ofertas de la última semana no alertadas
          const unalertedOffers = await this.getUnalertedOffersForStudent(
            setting.studentId,
            weekAgo,
            THRESHOLD_COMPATIBILITY
          );

          if (unalertedOffers.length === 0) continue;

          // Enviar resumen semanal por email
          await emailService.sendWeeklyDigest({
            to: setting.student.user.email,
            firstName: setting.student.firstName,
            offers: unalertedOffers,
          });

          // Registrar en historial
          for (const offerData of unalertedOffers) {
            await AlertHistory.create({
              studentId: setting.studentId,
              offerId: offerData.offer.id,
              compatibilityScore: offerData.compatibilityScore,
              isFromFollowedCompany: offerData.isFromFollowedCompany,
              channel: 'email',
              emailSentAt: new Date(),
              wasIncludedInDigest: true,
              digestType: 'weekly',
            });
          }

          results.emailsSent++;
        } catch (error) {
          logger.error(`Error generando digest semanal para estudiante ${setting.studentId}:`, error);
          results.errors.push({ studentId: setting.studentId, error: error.message });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error generando digest semanal:', error);
      throw error;
    }
  },

  /**
   * Obtiene ofertas no alertadas para un estudiante desde una fecha
   */
  async getUnalertedOffersForStudent(studentId, sinceDate, minCompatibilityThreshold) {
    // Obtener todas las ofertas aprobadas desde la fecha
    const offers = await Offer.findAll({
      where: {
        status: 'approved',
        createdAt: { [Op.gte]: sinceDate },
      },
      include: [{ model: Company, as: 'company' }],
    });

    const result = [];

    for (const offer of offers) {
      // Verificar si ya fue alertada
      const alreadyAlerted = await this.wasOfferAlreadyAlerted(studentId, offer.id);
      if (alreadyAlerted) continue;

      // Calcular compatibilidad
      const compatibilityScore = await this.calculateCompatibility(studentId, offer);

      // Verificar si sigue a la empresa
      const isFromFollowedCompany = await this.isCompanyFollowed(studentId, offer.companyId);

      // Incluir si cumple umbral o es de empresa seguida
      if (compatibilityScore >= minCompatibilityThreshold || isFromFollowedCompany) {
        result.push({
          offer,
          compatibilityScore,
          isFromFollowedCompany,
        });
      }
    }

    // Ordenar por: empresas seguidas primero, luego por compatibilidad
    return result.sort((a, b) => {
      if (a.isFromFollowedCompany && !b.isFromFollowedCompany) return -1;
      if (!a.isFromFollowedCompany && b.isFromFollowedCompany) return 1;
      return b.compatibilityScore - a.compatibilityScore;
    });
  },

  /**
   * Obtiene el historial de alertas de un estudiante
   */
  async getAlertHistory(studentId, options = {}) {
    const { limit = 50, offset = 0, since } = options;

    const where = { studentId };
    if (since) {
      where.sentAt = { [Op.gte]: since };
    }

    const history = await AlertHistory.findAndCountAll({
      where,
      include: [
        {
          model: Offer,
          as: 'offer',
          include: [{ model: Company, as: 'company' }],
        },
      ],
      order: [['sentAt', 'DESC']],
      limit,
      offset,
    });

    return history;
  },
};

module.exports = alertService;
