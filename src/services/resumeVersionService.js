const { Resume, ResumeVersion } = require('../models');

const JSON_FIELDS = ['profile', 'personal', 'education', 'certifications', 'experience', 'skills', 'languages', 'projects'];

const ensurePlainObject = (value) => {
  if (value === null || value === undefined) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return JSON.parse(JSON.stringify(value));
  }
  return {};
};

const parsePlainVersion = (raw) => {
  const result = { ...raw };
  JSON_FIELDS.forEach(f => {
    result[f] = ensurePlainObject(raw[f]);
  });
  // Mapear campos de BD (snake_case) a camelCase para el frontend
  if (raw.completion_percentage !== undefined) {
    result.completionPercentage = raw.completion_percentage;
  }
  if (raw.created_at !== undefined) {
    result.created_at = raw.created_at;
  }
  return result;
};

const createVersion = async (studentId, template = null, pdfUrl = null) => {
  const resume = await Resume.findOne({ where: { studentId }, raw: true });

  if (!resume) {
    const error = new Error('No se encontró un CV activo para guardar la versión.');
    error.statusCode = 404;
    throw error;
  }

  const version = await ResumeVersion.create({
    studentId,
    profile: resume.profile,
    personal: resume.personal,
    education: resume.education,
    experience: resume.experience,
    skills: resume.skills,
    languages: resume.languages,
    projects: resume.projects,
    certifications: resume.certifications,
    completionPercentage: resume.completionPercentage,
    template,
    pdfUrl,
  });

  return version;
};

const getVersionsByStudent = async (studentId, limit = 20) => {
  const versions = await ResumeVersion.findAll({
    where: { studentId },
    order: [['created_at', 'DESC']],
    limit,
    raw: true,
  });

  return versions.map(parsePlainVersion);
};

const getVersionById = async (versionId, studentId) => {
  const version = await ResumeVersion.findOne({
    where: { id: versionId, studentId },
    raw: true,
  });

  if (!version) {
    const error = new Error('Versión no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  return parsePlainVersion(version);
};

const restoreVersion = async (versionId, studentId) => {
  const version = await getVersionById(versionId, studentId);

  const [updated] = await Resume.update(
    {
      profile: version.profile,
      personal: version.personal,
      education: version.education,
      experience: version.experience,
      skills: version.skills,
      languages: version.languages,
      projects: version.projects,
      certifications: version.certifications,
      completionPercentage: version.completionPercentage,
    },
    { where: { studentId } }
  );

  if (updated === 0) {
    const error = new Error('No se pudo restaurar la versión.');
    error.statusCode = 500;
    throw error;
  }

  const updatedResume = await Resume.findOne({ where: { studentId }, raw: true });
  return parsePlainVersion(updatedResume);
};

const deleteVersion = async (versionId, studentId) => {
  const version = await ResumeVersion.findOne({
    where: { id: versionId, studentId },
  });

  if (!version) {
    const error = new Error('Versión no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  await version.destroy();
  return { message: 'Versión eliminada correctamente.' };
};

module.exports = {
  createVersion,
  getVersionsByStudent,
  getVersionById,
  restoreVersion,
  deleteVersion,
};
