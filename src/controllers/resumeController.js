const resumeService = require('../services/resumeService');
const resumePdfService = require('../services/resumePdfService');

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
    const { buffer, filename } = await resumePdfService.exportResumePdf(studentId, template);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
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
};
