const applicationService = require('../services/applicationService');

const applicationController = {
  async createApplication(req, res, next) {
    try {
      const studentId = req.user.studentProfile?.id;
      if (!studentId) {
        return res.status(403).json({ success: false, message: 'Solo estudiantes' });
      }
      const { offerId, resumeId, coverLetter } = req.body;
      const application = await applicationService.createApplication(studentId, offerId, resumeId, coverLetter);
      res.status(201).json({ success: true, data: application });
    } catch (error) {
      next(error);
    }
  },

  async getApplicationPreview(req, res, next) {
    try {
      const studentId = req.user.studentProfile?.id;
      if (!studentId) return res.status(403).json({ success: false, message: 'Solo estudiantes' });
      const preview = await applicationService.getApplicationPreview(studentId, req.params.offerId);
      res.json({ success: true, data: preview });
    } catch (error) {
      next(error);
    }
  },

  async getMyApplications(req, res, next) {
    try {
      const studentId = req.user.studentProfile?.id;
      if (!studentId) return res.status(403).json({ success: false, message: 'Solo estudiantes' });
      const apps = await applicationService.getStudentApplications(studentId);
      res.json({ success: true, data: apps });
    } catch (error) {
      next(error);
    }
  },

  async canApply(req, res, next) {
    try {
      const studentId = req.user.studentProfile?.id;
      if (!studentId) return res.status(403).json({ success: false, message: 'Solo estudiantes' });
      const result = await applicationService.canStudentApply(studentId, req.params.offerId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getOfferApplications(req, res, next) {
    try {
      const companyId = req.user.companyProfile?.id;
      if (!companyId) return res.status(403).json({ success: false, message: 'Solo empresas' });
      const apps = await applicationService.getOfferApplications(req.params.offerId, companyId);
      res.json({ success: true, data: apps });
    } catch (error) {
      next(error);
    }
  },

  async updateApplicationStatus(req, res, next) {
    try {
      const companyId = req.user.companyProfile?.id;
      if (!companyId) return res.status(403).json({ success: false, message: 'Solo empresas' });
      const updated = await applicationService.updateApplicationStatus(req.params.applicationId, companyId, req.body.status, req.body.notes);
      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = applicationController;