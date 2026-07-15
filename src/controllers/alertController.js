const { body, query } = require('express-validator');
const alertService = require('../services/alertService');
const { Student } = require('../models');

const alertController = {
  /**
   * Obtiene la configuración de alertas del estudiante actual
   */
  async getSettings(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const settings = await alertService.getOrCreateSettings(student.id);
      res.json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Actualiza la configuración de alertas del estudiante
   */
  async updateSettings(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const updateData = req.body;
      const settings = await alertService.updateSettings(student.id, updateData);

      res.json({ success: true, data: settings, message: 'Configuración actualizada exitosamente' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Obtiene el historial de alertas del estudiante
   */
  async getAlertHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const student = await Student.findOne({ where: { userId } });

      if (!student) {
        return res.status(404).json({ success: false, message: 'Perfil de estudiante no encontrado' });
      }

      const { limit = 50, offset = 0, since } = req.query;
      const history = await alertService.getAlertHistory(student.id, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        since: since || undefined,
      });

      res.json({
        success: true,
        data: history.rows,
        pagination: {
          total: history.count,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Valida los datos de actualización de configuración
   */
  validateSettingsUpdate: [
    body('frequency')
      .optional()
      .isIn(['immediate', 'daily', 'weekly'])
      .withMessage('La frecuencia debe ser: immediate, daily o weekly'),
    body('emailEnabled')
      .optional()
      .isBoolean()
      .withMessage('emailEnabled debe ser un booleano'),
    body('platformEnabled')
      .optional()
      .isBoolean()
      .withMessage('platformEnabled debe ser un booleano'),
    body('dailyDigestTime')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)
      .withMessage('El formato de hora debe ser HH:MM:SS'),
    body('weeklyDigestDay')
      .optional()
      .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
      .withMessage('Día de la semana inválido'),
  ],

  /**
   * Valida los parámetros de consulta del historial
   */
  validateHistoryQuery: [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('since').optional().isISO8601(),
  ],
};

module.exports = alertController;
