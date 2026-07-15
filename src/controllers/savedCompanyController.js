const { body, param } = require('express-validator');
const savedCompanyService = require('../services/savedCompanyService');
const { Student } = require('../models');

const savedCompanyController = {
  /**
   * Sigue a una empresa
   */
  async followCompany(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const { companyId } = req.params;
      const savedCompany = await savedCompanyService.followCompany(student.id, parseInt(companyId));

      res.status(201).json({
        success: true,
        data: savedCompany,
        message: 'Empresa seguida exitosamente',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deja de seguir a una empresa
   */
  async unfollowCompany(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const { companyId } = req.params;
      const result = await savedCompanyService.unfollowCompany(student.id, parseInt(companyId));

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verifica si el estudiante sigue a una empresa
   */
  async isFollowing(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const { companyId } = req.params;
      const isFollowing = await savedCompanyService.isFollowing(student.id, parseInt(companyId));

      res.json({ success: true, isFollowing });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene todas las empresas seguidas por el estudiante
   */
  async getFollowedCompanies(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const { includeOffers = 'true' } = req.query;
      const companies = await savedCompanyService.getFollowedCompanies(student.id, {
        includeActiveOffers: includeOffers === 'true',
      });

      res.json({ success: true, data: companies });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene el feed de ofertas de empresas seguidas
   */
  async getFollowedCompaniesFeed(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const { limit = 20, offset = 0 } = req.query;
      const offers = await savedCompanyService.getFollowedCompaniesFeed(student.id, {
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: offers.rows,
        pagination: {
          total: offers.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene el conteo de empresas seguidas
   */
  async getFollowedCount(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const count = await savedCompanyService.getFollowedCount(student.id);
      res.json({ success: true, count });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene sugerencias de empresas para el estudiante
   */
  async getSuggestedCompanies(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const { limit = 5 } = req.query;
      const companies = await savedCompanyService.getSuggestedCompanies(student.id, {
        limit: parseInt(limit),
      });

      res.json({ success: true, data: companies });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza preferencias de notificaciones para una empresa seguida
   */
  async updateNotificationPreference(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const { companyId } = req.params;
      const { notificationsEnabled } = req.body;

      const savedCompany = await savedCompanyService.updateNotificationPreference(
        student.id,
        parseInt(companyId),
        notificationsEnabled
      );

      res.json({
        success: true,
        data: savedCompany,
        message: 'Preferencias de notificación actualizadas',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validaciones
   */
  validateCompanyId: [
    param('companyId').isInt({ min: 1 }).withMessage('ID de empresa inválido'),
  ],

  validateNotificationPreference: [
    param('companyId').isInt({ min: 1 }),
    body('notificationsEnabled').isBoolean().withMessage('notificationsEnabled debe ser booleano'),
  ],

};

module.exports = savedCompanyController;
