const puppeteer = require('puppeteer');
const { getResume } = require('./resumeService');
const { createVersion } = require('./resumeVersionService');

const ALLOWED_TEMPLATES = ['harvard', 'investment-banking'];

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const formatDateForFile = (date = new Date()) => date.toISOString().slice(0, 10);

const normalizeFilePart = (value) => String(value || 'cv')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'cv';

const asArray = (value) => (Array.isArray(value) ? value : []);

const splitList = (value) => String(value || '')
  .split(/[\n;,]+/)
  .map(item => item.trim())
  .filter(Boolean);

const getResumeSections = (resume) => {
  const personal = resume.personal || {};
  const profile = resume.profile || {};
  const education = resume.education || {};
  const experience = resume.experience || {};
  const projects = resume.projects || {};
  const certifications = resume.certifications || {};
  const skills = resume.skills || {};
  const languages = resume.languages || {};

  return {
    personal,
    profile,
    educationItems: asArray(education.items).filter(item => item.degree || item.institution),
    experienceItems: asArray(experience.items).filter(item => item.role || item.company || item.description),
    projectItems: asArray(projects.items).filter(item => item.title || item.description || asArray(item.bullets).some(Boolean)),
    certificationItems: asArray(certifications.items).filter(item => item.name || item.issuer),
    skillAreas: asArray(skills.areas).filter(item => item.area || item.skills),
    skills,
    languages,
  };
};

const renderBullets = (items) => {
  const cleanItems = items.filter(Boolean);
  if (!cleanItems.length) return '';
  return `<ul>${cleanItems.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
};

const renderSection = (title, content) => content ? `<section><h2>${escapeHtml(title)}</h2>${content}</section>` : '';

const renderHarvardTemplate = (resume) => {
  const data = getResumeSections(resume);
  const contact = [data.personal.email, data.personal.phone, data.personal.linkedin].filter(Boolean).map(escapeHtml).join(' · ');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 18mm 18mm; }
  body { color: #111827; font-family: "Times New Roman", Times, serif; font-size: 11px; line-height: 1.42; }
  h1 { font-size: 20px; margin: 0; text-align: center; text-transform: uppercase; letter-spacing: 0.8px; }
  .contact { margin-top: 4px; text-align: center; font-size: 10px; color: #374151; }
  section { margin-top: 12px; break-inside: avoid; }
  h2 { border-bottom: 1px solid #111827; font-size: 11px; letter-spacing: 1.7px; margin: 0 0 6px; padding-bottom: 2px; text-transform: uppercase; }
  .row { display: flex; justify-content: space-between; gap: 16px; }
  .title { font-weight: 700; }
  .muted { color: #4b5563; }
  .italic { font-style: italic; }
  p { margin: 0 0 4px; }
  ul { margin: 3px 0 0 16px; padding: 0; }
  li { margin-bottom: 2px; }
</style>
</head>
<body>
  <h1>${escapeHtml(data.personal.fullName || 'Curriculum Vitae')}</h1>
  ${contact ? `<div class="contact">${contact}</div>` : ''}
  ${renderSection('Perfil Profesional', data.profile.summary ? `<p>${escapeHtml(data.profile.summary)}</p>` : '')}
  ${renderSection('Formación Académica', data.educationItems.map(item => `
    <div>
      <div class="row"><p class="title">${escapeHtml(item.institution)}</p><p class="muted">${escapeHtml([item.startDate, item.endDate].filter(Boolean).join(' – '))}</p></div>
      <p class="italic">${escapeHtml(item.degree)}</p>
      ${item.courses ? `<p class="muted">${escapeHtml(item.courses)}</p>` : ''}
    </div>`).join(''))}
  ${renderSection('Experiencia Profesional', data.experienceItems.map(item => `
    <div>
      <div class="row"><p class="title">${escapeHtml(item.role)}</p><p class="muted">${escapeHtml(item.period)}</p></div>
      ${item.company ? `<p class="italic">${escapeHtml(item.company)}</p>` : ''}
      ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}
    </div>`).join(''))}
  ${renderSection('Proyectos', data.projectItems.map(item => `
    <div><p class="title">${escapeHtml(item.title)}</p>${renderBullets(asArray(item.bullets).length ? asArray(item.bullets) : splitList(item.description))}</div>`).join(''))}
  ${renderSection('Certificaciones', data.certificationItems.map(item => `<p><span class="title">${escapeHtml(item.name)}</span>${item.issuer ? ` — ${escapeHtml(item.issuer)}` : ''}${item.date ? ` <span class="muted">(${escapeHtml(item.date)})</span>` : ''}</p>`).join(''))}
  ${renderSection('Habilidades', `${data.skillAreas.map(item => `<p><span class="title">${escapeHtml(item.area || 'Técnicas')}:</span> ${escapeHtml(item.skills)}</p>`).join('')}${data.skills.technical ? `<p><span class="title">Técnicas:</span> ${escapeHtml(data.skills.technical)}</p>` : ''}${data.skills.soft ? `<p><span class="title">Blandas:</span> ${escapeHtml(data.skills.soft)}</p>` : ''}`)}
  ${renderSection('Idiomas', data.languages.list ? `<p>${escapeHtml(data.languages.list)}</p>` : '')}
</body>
</html>`;
};

const renderInvestmentBankingTemplate = (resume) => {
  const data = getResumeSections(resume);
  const contact = [data.personal.email, data.personal.phone, data.personal.linkedin].filter(Boolean).map(escapeHtml).join(' | ');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4; margin: 14mm 16mm; }
  body { color: #111827; font-family: Arial, Helvetica, sans-serif; font-size: 10.2px; line-height: 1.28; }
  h1 { border-bottom: 2px solid #111827; font-size: 18px; margin: 0 0 3px; padding-bottom: 4px; text-align: center; text-transform: uppercase; }
  .contact { margin-bottom: 10px; text-align: center; font-size: 9.5px; color: #374151; }
  section { margin-top: 9px; break-inside: avoid; }
  h2 { background: #e5e7eb; border-top: 1px solid #111827; border-bottom: 1px solid #111827; font-size: 10.5px; margin: 0 0 5px; padding: 2px 5px; text-transform: uppercase; }
  .row { display: flex; justify-content: space-between; gap: 14px; }
  .title { font-weight: 700; }
  .muted { color: #374151; }
  .italic { font-style: italic; }
  p { margin: 0 0 3px; }
  ul { margin: 2px 0 0 16px; padding: 0; }
  li { margin-bottom: 1px; }
</style>
</head>
<body>
  <h1>${escapeHtml(data.personal.fullName || 'Curriculum Vitae')}</h1>
  ${contact ? `<div class="contact">${contact}</div>` : ''}
  ${renderSection('Perfil Profesional', data.profile.summary ? `<p>${escapeHtml(data.profile.summary)}</p>` : '')}
  ${renderSection('Formación Académica', data.educationItems.map(item => `
    <div>
      <div class="row"><p class="title">${escapeHtml(item.institution)}</p><p>${escapeHtml([item.startDate, item.endDate].filter(Boolean).join(' – '))}</p></div>
      <p class="italic">${escapeHtml(item.degree)}</p>
      ${item.courses ? `<p class="muted">Cursos relevantes: ${escapeHtml(item.courses)}</p>` : ''}
    </div>`).join(''))}
  ${renderSection('Experiencia Profesional', data.experienceItems.map(item => `
    <div>
      <div class="row"><p class="title">${escapeHtml(item.company || item.role)}</p><p>${escapeHtml(item.period)}</p></div>
      ${item.company && item.role ? `<p class="italic">${escapeHtml(item.role)}</p>` : ''}
      ${renderBullets(splitList(item.description))}
    </div>`).join(''))}
  ${renderSection('Proyectos', data.projectItems.map(item => `
    <div><p class="title">${escapeHtml(item.title)}</p>${renderBullets(asArray(item.bullets).length ? asArray(item.bullets) : splitList(item.description))}</div>`).join(''))}
  ${renderSection('Certificaciones', data.certificationItems.map(item => `<p><span class="title">${escapeHtml(item.name)}</span>${item.issuer ? ` — ${escapeHtml(item.issuer)}` : ''}${item.date ? ` <span class="muted">(${escapeHtml(item.date)})</span>` : ''}</p>`).join(''))}
  ${renderSection('Habilidades', `${data.skillAreas.map(item => `<p><span class="title">${escapeHtml(item.area || 'Técnicas')}:</span> ${escapeHtml(item.skills)}</p>`).join('')}${data.skills.technical ? `<p><span class="title">Técnicas:</span> ${escapeHtml(data.skills.technical)}</p>` : ''}${data.skills.soft ? `<p><span class="title">Blandas:</span> ${escapeHtml(data.skills.soft)}</p>` : ''}`)}
  ${renderSection('Idiomas', data.languages.list ? `<p>${escapeHtml(data.languages.list)}</p>` : '')}
</body>
</html>`;
};

const renderResumeHtml = (resume, template) => {
  if (template === 'harvard') return renderHarvardTemplate(resume);
  if (template === 'investment-banking') return renderInvestmentBankingTemplate(resume);
  const error = new Error('Plantilla de CV no válida.');
  error.statusCode = 400;
  throw error;
};

const exportResumePdf = async (studentId, template) => {
  if (!ALLOWED_TEMPLATES.includes(template)) {
    const error = new Error('Plantilla de CV no permitida.');
    error.statusCode = 400;
    throw error;
  }

  const resume = await getResume(studentId);
  const html = renderResumeHtml(resume, template);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfData = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    const buffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
    const filename = `${normalizeFilePart(resume.personal?.fullName)}-${template}-${formatDateForFile()}.pdf`;

    // Guardar versión en el historial después de exportar exitosamente
    await createVersion(studentId, template, null);

    return { buffer, filename };
  } finally {
    await browser.close();
  }
};

module.exports = {
  ALLOWED_TEMPLATES,
  exportResumePdf,
};
