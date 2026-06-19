const resumeService = require('../services/resumeService');
// CORRECCIÓN: Asignamos un alias (exportVersionPdfService) a la función importada
const { exportResumePdf, exportVersionPdf: exportVersionPdfService } = require('../services/resumePdfService');
const resumeVersionService = require('../services/resumeVersionService');

const getResume = async (req, res, next) => {
  try {
    const studentId = req.user.studentProfile.id;
    const resume = await resumeService.getResume(studentId);
    return res.status(200).json(resume);
  } catch (error) {
    return next(error);
  }
};

const updateSection = async (req, res, next) => {
  try {
    const { section } = req.params;
    const studentId = req.user.studentProfile.id;
    const resume = await resumeService.updateSection(studentId, section, req.body);
    return res.status(200).json(resume);
  } catch (error) {
    return next(error);
  }
};

const improveField = async (req, res, next) => {
  try {
    const { section, field } = req.params;
    const studentId = req.user.studentProfile.id;
    const suggestion = await resumeService.improveField(studentId, section, field);
    return res.status(200).json(suggestion);
  } catch (error) {
    return next(error);
  }
};

const improveFullSection = async (req, res, next) => {
  try {
    const { section } = req.params;
    const studentId = req.user.studentProfile.id;
    const suggestion = await resumeService.improveFullSection(studentId, section);
    return res.status(200).json(suggestion);
  } catch (error) {
    return next(error);
  }
};

const exportPdf = async (req, res, next) => {
  try {
    const studentId = req.user.studentProfile.id;
    const { template } = req.body;
    const { buffer, filename } = await exportResumePdf(studentId, template);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    return next(error);
  }
};

const exportVersionPdf = async (req, res, next) => {
  try {
    const studentId = req.user.studentProfile.id;
    const { versionId } = req.params;
    const { template = 'harvard' } = req.query;
    
    // CORRECCIÓN: Usamos el alias aquí para llamar al servicio
    const { buffer, filename } = await exportVersionPdfService(versionId, studentId, template);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (error) {
    return next(error);
  }
};

/**
 * Guarda manualmente una versión del CV con un título personalizado.
 * POST /resume/versions
 */
const saveVersion = async (req, res, next) => {
  try {
    const studentId = req.user.studentProfile.id;
    const { title, template } = req.body;
    const version = await resumeVersionService.createVersion(studentId, {
      title: title || null,
      template: template || null,
    });
    return res.status(201).json({
      message: 'Versión guardada correctamente.',
      version,
    });
  } catch (error) {
    return next(error);
  }
};

const getVersions = async (req, res, next) => {
  try {
    const studentId = req.user.studentProfile.id;
    const limit = parseInt(req.query.limit, 10) || 20;
    const versions = await resumeVersionService.getVersionsByStudent(studentId, limit);
    return res.status(200).json(versions);
  } catch (error) {
    return next(error);
  }
};

const restoreVersion = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const studentId = req.user.studentProfile.id;
    const restored = await resumeVersionService.restoreVersion(versionId, studentId);
    return res.status(200).json({
      message: 'Versión restaurada correctamente.',
      resume: restored,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteVersion = async (req, res, next) => {
  try {
    const { versionId } = req.params;
    const studentId = req.user.studentProfile.id;
    const result = await resumeVersionService.deleteVersion(versionId, studentId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getResume,
  updateSection,
  improveField,
  improveFullSection,
  exportPdf,
  exportVersionPdf,
  saveVersion,
  getVersions,
  restoreVersion,
  deleteVersion,
};
