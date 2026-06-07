const { SavedCompany, Company, Student, User, Offer } = require('../models');
const { Op } = require('sequelize');

const savedCompanyService = {
  /**
   * Sigue a una empresa
   */
  async followCompany(studentId, companyId) {
    // Verificar si ya existe
    const existing = await SavedCompany.findOne({
      where: { studentId, companyId },
    });

    if (existing) {
      throw new Error('Ya estás siguiendo a esta empresa');
    }

    // Verificar que la empresa exista
    const company = await Company.findByPk(companyId);
    if (!company) {
      throw new Error('Empresa no encontrada');
    }

    const savedCompany = await SavedCompany.create({
      studentId,
      companyId,
      followedAt: new Date(),
      notificationsEnabled: true,
    });

    return savedCompany;
  },

  /**
   * Deja de seguir a una empresa
   */
  async unfollowCompany(studentId, companyId) {
    const savedCompany = await SavedCompany.findOne({
      where: { studentId, companyId },
    });

    if (!savedCompany) {
      throw new Error('No estás siguiendo a esta empresa');
    }

    await savedCompany.destroy();
    return { success: true, message: 'Empresa dejada de seguir' };
  },

  /**
   * Verifica si un estudiante sigue a una empresa
   */
  async isFollowing(studentId, companyId) {
    const savedCompany = await SavedCompany.findOne({
      where: { studentId, companyId },
    });
    return !!savedCompany;
  },

  /**
   * Obtiene todas las empresas seguidas por un estudiante
   */
  async getFollowedCompanies(studentId, options = {}) {
    const { includeActiveOffers = true } = options;

    const savedCompanies = await SavedCompany.findAll({
      where: { studentId },
      include: [
        {
          model: Company,
          as: 'company',
          include: includeActiveOffers
            ? [
                {
                  model: Offer,
                  as: 'offers',
                  where: { status: 'approved' },
                  required: false,
                },
              ]
            : [],
        },
      ],
      order: [['followedAt', 'DESC']],
    });

    return savedCompanies;
  },

  /**
   * Obtiene el feed de ofertas de empresas seguidas
   */
  async getFollowedCompaniesFeed(studentId, options = {}) {
    const { limit = 20, offset = 0 } = options;

    // Obtener IDs de empresas seguidas
    const followedCompanies = await SavedCompany.findAll({
      where: { studentId },
      attributes: ['companyId'],
    });

    const companyIds = followedCompanies.map((fc) => fc.companyId);

    if (companyIds.length === 0) {
      return { count: 0, rows: [] };
    }

    // Obtener ofertas de esas empresas
    const offers = await Offer.findAndCountAll({
      where: {
        companyId: { [Op.in]: companyIds },
        status: 'approved',
      },
      include: [
        {
          model: Company,
          as: 'company',
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return offers;
  },

  /**
   * Obtiene el conteo de empresas seguidas por un estudiante
   */
  async getFollowedCount(studentId) {
    return await SavedCompany.count({
      where: { studentId },
    });
  },

  /**
   * Obtiene el conteo de seguidores de una empresa
   */
  async getFollowersCount(companyId) {
    return await SavedCompany.count({
      where: { companyId },
    });
  },

  /**
   * Obtiene estadísticas de seguidores para una empresa (distribución por carrera)
   */
  async getFollowerStats(companyId) {
    const followers = await SavedCompany.findAll({
      where: { companyId },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['career', 'university'],
        },
      ],
    });

    // Calcular distribución por carrera
    const careerDistribution = {};
    const universityDistribution = {};

    followers.forEach((follower) => {
      const career = follower.student?.career || 'Sin carrera';
      const university = follower.student?.university || 'Sin universidad';

      careerDistribution[career] = (careerDistribution[career] || 0) + 1;
      universityDistribution[university] = (universityDistribution[university] || 0) + 1;
    });

    return {
      totalFollowers: followers.length,
      careerDistribution: Object.entries(careerDistribution).map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / followers.length) * 100),
      })),
      universityDistribution: Object.entries(universityDistribution).map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / followers.length) * 100),
      })),
    };
  },

  /**
   * Actualiza preferencias de notificaciones para una empresa seguida
   */
  async updateNotificationPreference(studentId, companyId, notificationsEnabled) {
    const savedCompany = await SavedCompany.findOne({
      where: { studentId, companyId },
    });

    if (!savedCompany) {
      throw new Error('No estás siguiendo a esta empresa');
    }

    savedCompany.notificationsEnabled = notificationsEnabled;
    await savedCompany.save();

    return savedCompany;
  },

  /**
   * Obtiene sugerencias de empresas para un estudiante (basado en su carrera)
   */
  async getSuggestedCompanies(studentId, options = {}) {
    const { limit = 5 } = options;

    const student = await Student.findByPk(studentId);
    if (!student) {
      throw new Error('Estudiante no encontrado');
    }

    // Obtener IDs de empresas ya seguidas
    const followedCompanies = await SavedCompany.findAll({
      where: { studentId },
      attributes: ['companyId'],
    });
    const followedIds = followedCompanies.map((fc) => fc.companyId);

    // Buscar empresas que publiquen ofertas relacionadas con la carrera del estudiante
    const suggestedCompanies = await Company.findAll({
      where: {
        id: { [Op.notIn]: followedIds.length > 0 ? followedIds : [0] },
        isVerified: true,
      },
      include: [
        {
          model: Offer,
          as: 'offers',
          where: {
            status: 'approved',
            careerTags: { [Op.like]: `%${student.career}%` },
          },
          required: true,
        },
      ],
      limit,
    });

    return suggestedCompanies;
  },
};

module.exports = savedCompanyService;
