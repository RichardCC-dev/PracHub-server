const { Application, Student, Offer, Company, Resume, User } = require('../models');
const { Op } = require('sequelize');

const applicationService = {
  /**
   * Crear una nueva postulación (One-click apply)
   * @param {number} studentId - ID del estudiante
   * @param {number} offerId - ID de la oferta
   * @param {number} resumeId - ID del CV activo
   * @param {string} coverLetter - Carta de presentación (opcional)
   */
  async createApplication(studentId, offerId, resumeId, coverLetter = null) {
    // Verificar si ya existe una postulación para esta oferta
    const existingApplication = await Application.findOne({
      where: {
        studentId,
        offerId,
      },
    });

    if (existingApplication) {
      const error = new Error('Ya has postulado a esta oferta anteriormente');
      error.code = 'DUPLICATE_APPLICATION';
      throw error;
    }

    // Verificar que el estudiante existe
    const student = await Student.findByPk(studentId);
    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    // Verificar que la oferta existe y está activa
    const offer = await Offer.findByPk(offerId, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'legalName', 'tradeName'],
        },
      ],
    });

    if (!offer) {
      throw new Error('Oferta no encontrada');
    }

    if (offer.status !== 'approved') {
      throw new Error('Esta oferta no está disponible para postulaciones');
    }

    // Verificar que el CV existe y pertenece al estudiante
    const resume = await Resume.findOne({
      where: {
        id: resumeId,
        studentId,
      },
    });

    if (!resume) {
      throw new Error('CV no encontrado o no pertenece al estudiante');
    }

    // Crear la postulación
    const application = await Application.create({
      studentId,
      offerId,
      resumeId,
      coverLetter,
      status: 'enviada',
      appliedAt: new Date(),
    });

    // Retornar la postulación con datos relacionados
    return await Application.findByPk(application.id, {
      include: [
        {
          model: Offer,
          as: 'offer',
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'legalName', 'tradeName', 'logoUrl'],
            },
          ],
        },
        {
          model: Resume,
          as: 'resume',
          attributes: ['id', 'completionPercentage'],
        },
      ],
    });
  },

  /**
   * Previsualizar datos de postulación antes de confirmar
   * @param {number} studentId - ID del estudiante
   * @param {number} offerId - ID de la oferta
   */
  async getApplicationPreview(studentId, offerId) {
    // Verificar si ya postuló
    const existingApplication = await Application.findOne({
      where: {
        studentId,
        offerId,
      },
    });

    if (existingApplication) {
      const error = new Error('Ya has postulado a esta oferta');
      error.code = 'ALREADY_APPLIED';
      throw error;
    }

    // Obtener datos del estudiante
    const student = await Student.findByPk(studentId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email'],
        },
      ],
    });

    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    // Obtener CV activo del estudiante
    const activeResume = await Resume.findOne({
      where: {
        studentId,
        completionPercentage: {
          [Op.gte]: 80,
        },
      },
      order: [['created_at', 'DESC']],
    });

    // Obtener datos de la oferta
    const offer = await Offer.findByPk(offerId, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'legalName', 'tradeName', 'logoUrl'],
        },
      ],
    });

    if (!offer) {
      throw new Error('Oferta no encontrada');
    }

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.user?.email,
        university: student.university,
        career: student.career,
      },
      offer: {
        id: offer.id,
        title: offer.title,
        company: offer.company,
        modality: offer.modality,
        duration: offer.duration,
        area: offer.area,
      },
      resume: activeResume
        ? {
            id: activeResume.id,
            completionPercentage: activeResume.completionPercentage,
            createdAt: activeResume.created_at,
          }
        : null,
      canApply: !!activeResume && offer.status === 'approved',
    };
  },

  /**
   * Obtener todas las postulaciones de un estudiante
   * @param {number} studentId - ID del estudiante
   * @param {object} filters - Filtros opcionales (status)
   */
  async getStudentApplications(studentId, filters = {}) {
    const where = { studentId };

    if (filters.status) {
      where.status = filters.status;
    }

    return await Application.findAll({
      where,
      include: [
        {
          model: Offer,
          as: 'offer',
          include: [
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'legalName', 'tradeName', 'logoUrl'],
            },
          ],
        },
        {
          model: Resume,
          as: 'resume',
          attributes: ['id', 'completionPercentage'],
        },
      ],
      order: [['appliedAt', 'DESC']],
    });
  },

  /**
   * Obtener postulaciones de una oferta (para empresas)
   * @param {number} offerId - ID de la oferta
   * @param {number} companyId - ID de la empresa (para verificación)
   */
  async getOfferApplications(offerId, companyId) {
    // Verificar que la oferta pertenece a la empresa
    const offer = await Offer.findOne({
      where: {
        id: offerId,
        companyId,
      },
    });

    if (!offer) {
      throw new Error('Oferta no encontrada o no pertenece a la empresa');
    }

    return await Application.findAll({
      where: { offerId },
      include: [
        {
          model: Student,
          as: 'student',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['email'],
            },
          ],
          attributes: ['id', 'firstName', 'lastName', 'university', 'career', 'profilePictureUrl', 'phoneNumber'],
        },
        {
          model: Resume,
          as: 'resume',
          attributes: ['id', 'completionPercentage', 'profile', 'personal', 'education', 'experience', 'skills', 'languages', 'projects', 'certifications'],
        },
      ],
      order: [['appliedAt', 'DESC']],
    });
  },

  /**
   * Actualizar estado de una postulación (para empresas)
   * @param {number} applicationId - ID de la postulación
   * @param {number} companyId - ID de la empresa
   * @param {string} status - Nuevo estado
   * @param {string} notes - Notas opcionales
   */
  async updateApplicationStatus(applicationId, companyId, status, notes = null, internalNotes = null) {
    const notificationService = require('./notificationService');
    const application = await Application.findByPk(applicationId, {
      include: [
        {
          model: Offer,
          as: 'offer',
        },
        {
          model: Student,
          as: 'student',
          include: [{ model: User, as: 'user', attributes: ['id'] }],
        },
      ],
    });

    if (!application) {
      throw new Error('Postulación no encontrada');
    }

    if (application.offer.companyId !== companyId) {
      throw new Error('No tienes permiso para actualizar esta postulación');
    }

    const validStatuses = ['enviada', 'revision', 'descartada', 'aceptada'];
    if (!validStatuses.includes(status)) {
      throw new Error('Estado no válido');
    }

    application.status = status;
    if (notes !== null && notes !== undefined) {
      application.companyNotes = notes || null;
    }
    if (internalNotes !== null && internalNotes !== undefined) {
      application.internalNotes = internalNotes || null;
    }
    if (status === 'descartada' || status === 'aceptada') {
      application.companyResponseAt = new Date();
    }

    await application.save();

    // Crear notificación para el estudiante si el estado cambió a algo relevante
    if (['revision', 'aceptada', 'descartada'].includes(status)) {
      const studentUserId = application.student?.user?.id;
      if (studentUserId) {
        await notificationService.createStatusChangeNotification(
          studentUserId,
          applicationId,
          application.offer.title,
          status,
          notes
        );
      }
    }

    return application;
  },

  /**
   * Verificar si un estudiante puede postular a una oferta
   * @param {number} studentId - ID del estudiante
   * @param {number} offerId - ID de la oferta
   */
  async canStudentApply(studentId, offerId) {
    const [existingApplication, offer, activeResume] = await Promise.all([
      Application.findOne({
        where: {
          studentId,
          offerId,
        },
      }),
      Offer.findByPk(offerId),
      Resume.findOne({
        where: {
          studentId,
          completionPercentage: {
            [Op.gte]: 80,
          },
        },
      }),
    ]);

    if (existingApplication) {
      return {
        canApply: false,
        reason: 'Ya has postulado a esta oferta',
        applicationId: existingApplication.id,
        status: existingApplication.status,
      };
    }

    if (!offer || offer.status !== 'approved') {
      return {
        canApply: false,
        reason: 'Esta oferta no está disponible',
      };
    }

    if (!activeResume) {
      return {
        canApply: false,
        reason: 'Necesitas tener un CV activo para postular',
      };
    }

    return {
      canApply: true,
      resumeId: activeResume.id,
    };
  },
};

module.exports = applicationService;
