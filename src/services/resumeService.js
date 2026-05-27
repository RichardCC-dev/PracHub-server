const { Resume } = require('../models');
const { improveText, improveSection } = require('./aiService');

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

const parsePlainResume = (raw) => {
  const result = { ...raw };
  JSON_FIELDS.forEach(f => {
    result[f] = ensurePlainObject(raw[f]);
  });
  return result;
};

const calculateCompletion = (resume) => {
  // Experiencia es opcional: no afecta el porcentaje
  const sections = [
    { weight: 20, filled: ['fullName', 'email', 'phone'].filter(f => resume.personal?.[f]?.trim()).length, total: 3 },
    { weight: 20, filled: resume.profile?.summary?.trim() ? 1 : 0, total: 1 },
    { weight: 20, filled: ['degree', 'institution'].filter(f => resume.education?.[f]?.trim()).length, total: 2 },
    { weight: 20, filled: ['technical', 'soft'].filter(f => resume.skills?.[f]?.trim()).length, total: 2 },
    { weight: 10, filled: resume.languages?.list?.trim() ? 1 : 0, total: 1 },
    { weight: 10, filled: (resume.projects?.items?.length > 0 && resume.projects.items.some(p => p.title?.trim())) ? 1 : 0, total: 1 },
  ];

  return Math.round(sections.reduce((acc, s) => acc + (s.filled / s.total) * s.weight, 0));
};

const getOrCreateResume = async (studentId) => {
  let resume = await Resume.findOne({ where: { studentId } });

  if (!resume) {
    resume = await Resume.create({
      studentId,
      profile: {},
      personal: {},
      education: {},
      certifications: {},
      experience: {},
      skills: {},
      languages: {},
      projects: {},
      completionPercentage: 0,
    });
  }

  return resume;
};

const updateSection = async (studentId, section, data) => {
  if (!JSON_FIELDS.includes(section)) {
    throw new Error('Sección no válida.');
  }

  const resume = await getOrCreateResume(studentId);

  const cleanData = ensurePlainObject(data);
  const currentSection = ensurePlainObject(resume[section]);
  const newSectionValue = { ...currentSection, ...cleanData };

  const plainResume = parsePlainResume(resume.toJSON());
  plainResume[section] = newSectionValue;
  const newCompletion = calculateCompletion(plainResume);

  await Resume.update(
    { [section]: newSectionValue, completionPercentage: newCompletion },
    { where: { id: resume.id } }
  );

  const updated = await Resume.findByPk(resume.id, { raw: true });
  return parsePlainResume(updated);
};

const improveField = async (studentId, section, field) => {
  const resume = await getOrCreateResume(studentId);
  const sectionData = ensurePlainObject(resume[section]);
  const content = sectionData[field];

  if (!content || content.trim() === '') {
    throw new Error('El campo está vacío. Escribe algo antes de pedir una sugerencia.');
  }

  const improved = await improveText({ section, field, content });
  return { original: content, improved };
};

const improveFullSection = async (studentId, section) => {
  const resume = await getOrCreateResume(studentId);
  const data = ensurePlainObject(resume[section]);

  let hasContent = false;

  if (section === 'experience' || section === 'projects') {
    hasContent = data.items?.some(item =>
      Object.values(item).some(value => value?.trim())
    );
  } else {
    hasContent = Object.values(data).some(value => value && value.trim() !== '');
  }

  if (!hasContent) {
    throw new Error('La sección está vacía. Escribe algo antes de pedir una sugerencia.');
  }

  const improved = await improveSection({ section, data });
  return { original: data, improved };
};

const getResume = async (studentId) => {
  const resume = await getOrCreateResume(studentId);
  return parsePlainResume(resume.toJSON());
};

module.exports = {
  getOrCreateResume,
  updateSection,
  improveField,
  improveFullSection,
  getResume,
};
