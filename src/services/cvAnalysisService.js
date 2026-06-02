const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Resume, Offer, CVAnalysis, Student, Company } = require('../models');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const JSON_FIELDS = ['profile', 'personal', 'education', 'certifications', 'experience', 'skills', 'languages', 'projects'];

const ensurePlainObject = (value) => {
  if (value === null || value === undefined) return {};
  let parsed = value;
  let iterations = 0;
  while (typeof parsed === 'string' && iterations < 3) {
    try { parsed = JSON.parse(parsed); } catch { parsed = {}; break; }
    iterations++;
  }
  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    return JSON.parse(JSON.stringify(parsed));
  }
  return {};
};

const safeJsonParse = (value, defaultValue = null) => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return defaultValue; }
  }
  return defaultValue;
};

const parsePlainResume = (raw) => {
  const result = { ...raw };
  JSON_FIELDS.forEach((f) => {
    result[f] = ensurePlainObject(raw[f]);
  });
  return result;
};

const parseAnalysisFields = (analysis) => ({
  ...analysis,
  sectionScores: safeJsonParse(analysis.sectionScores, {}),
  observations: safeJsonParse(analysis.observations, []),
  recommendations: safeJsonParse(analysis.recommendations, []),
  keywordsAnalysis: safeJsonParse(analysis.keywordsAnalysis, {}),
  improvedCv: safeJsonParse(analysis.improvedCv, {}),
});

const SCORE_RANGES = {
  excellent: { min: 80, max: 100, label: 'Excelente', color: 'green' },
  good: { min: 60, max: 79, label: 'Bueno', color: 'yellow' },
  needsImprovement: { min: 40, max: 59, label: 'Necesita mejoras', color: 'orange' },
  poor: { min: 0, max: 39, label: 'Requiere trabajo significativo', color: 'red' },
};

const getScoreCategory = (score) => {
  if (score >= SCORE_RANGES.excellent.min) return SCORE_RANGES.excellent;
  if (score >= SCORE_RANGES.good.min) return SCORE_RANGES.good;
  if (score >= SCORE_RANGES.needsImprovement.min) return SCORE_RANGES.needsImprovement;
  return SCORE_RANGES.poor;
};

const formatResumeForAnalysis = (resume) => {
  const sections = [];

  if (resume.personal) {
    sections.push(`DATOS PERSONALES:\n${JSON.stringify(resume.personal, null, 2)}`);
  }

  if (resume.profile?.summary) {
    sections.push(`PERFIL PROFESIONAL:\n${resume.profile.summary}`);
  }

  if (resume.education?.items?.length > 0) {
    const eduText = resume.education.items
      .map((item, i) => {
        const period = item.startDate || item.endDate
          ? `${item.startDate || ''} - ${item.endDate || 'Actual'}`
          : (item.year || '');
        return `  ${i + 1}. ${item.degree || ''} en ${item.institution || ''} (${period})`;
      })
      .join('\n');
    sections.push(`FORMACIÓN ACADÉMICA:\n${eduText}`);
  }

  if (resume.experience?.items?.length > 0) {
    const expText = resume.experience.items
      .map((item, i) => {
        const desc = item.description || '';
        return `  ${i + 1}. ${item.role || ''} en ${item.company || ''}\n     ${desc}`;
      })
      .join('\n\n');
    sections.push(`EXPERIENCIA LABORAL:\n${expText}`);
  }

  if (resume.projects?.items?.length > 0) {
    const projText = resume.projects.items
      .map((item, i) => {
        const bullets = Array.isArray(item.bullets) ? item.bullets.filter(Boolean).join('\n     • ') : '';
        const desc = item.description || '';
        const content = bullets || desc || 'Sin descripción';
        return `  ${i + 1}. ${item.title || 'Sin título'}\n     ${content}`;
      })
      .join('\n\n');
    sections.push(`PROYECTOS:\n${projText}`);
  }

  if (resume.skills) {
    const techSkills = resume.skills.areas?.map(a => a.skills).filter(Boolean).join(', ') || '';
    const softSkills = resume.skills.soft || '';
    sections.push(`HABILIDADES:\n  Técnicas: ${techSkills}\n  Blandas: ${softSkills}`);
  }

  if (resume.languages?.list) {
    sections.push(`IDIOMAS:\n${resume.languages.list}`);
  }

  if (resume.certifications?.items?.length > 0) {
    const certText = resume.certifications.items
      .map((item, i) => `  ${i + 1}. ${item.name || ''} - ${item.issuer || ''} (${item.date || ''})`)
      .join('\n');
    sections.push(`CERTIFICACIONES:\n${certText}`);
  }

  return sections.join('\n\n---\n\n');
};

const formatOfferForContext = (offer, company) => {
  if (!offer) return '';

  return `OFERTA DE PRÁCTICA:
Título: ${offer.title || 'No especificado'}
Empresa: ${company?.legalName || 'No especificada'}
Área: ${offer.area || 'No especificada'}
Descripción: ${offer.description || 'No especificada'}
Requisitos: ${offer.requirements || 'No especificados'}
Modalidad: ${offer.modality || 'No especificada'}
Carreras afines: ${offer.careerTags ? JSON.stringify(offer.careerTags) : 'No especificadas'}`;
};

const analyzeCVWithAI = async (resume, offer = null, company = null) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const resumeText = formatResumeForAnalysis(resume);
  const offerContext = formatOfferForContext(offer, company);

  const prompt = `Eres un experto reclutador y especialista en CVs para prácticas profesionales. Analiza el siguiente CV${offer ? ' en relación a la oferta de práctica proporcionada' : ''}.

${offerContext ? offerContext + '\n\n---\n\n' : ''}CV DEL CANDIDATO:
${resumeText}

Proporciona un análisis detallado en formato JSON con esta estructura exacta:

{
  "overallScore": número entre 0-100,
  "sectionScores": {
    "clarity": número 0-100,
    "impact": número 0-100,
    "grammar": número 0-100,
    "length": número 0-100,
    "keywords": número 0-100
  },
  "observations": [
    {
      "section": "nombre de la sección",
      "type": "strength|improvement|error",
      "message": "descripción detallada"
    }
  ],
  "recommendations": [
    "recomendación concreta 1",
    "recomendación concreta 2"
  ],
  "keywordsAnalysis": {
    "matched": ["palabras clave presentes"],
    "missing": ["palabras clave importantes faltantes"],
    "suggestions": ["sugerencias de palabras clave a agregar"]
  },
  "improvedCv": {
    "profile": { "summary": "versión mejorada del perfil" },
    "experience": { "items": [{ "company": "...", "role": "...", "description": "..." }] }
  }
}

Criterios de evaluación:
- Claridad: ¿El CV es fácil de leer y entender? ¿La información está bien organizada?
- Impacto: ¿Destaca logros y resultados concretos? ¿Usa métricas cuando es posible?
- Ortografía/Gramática: ¿No tiene errores tipográficos ni gramaticales?
- Extensión: ¿Tiene la longitud apropiada (1-2 páginas para estudiantes)?
- Palabras clave: ¿Incluye términos relevantes del sector${offer ? ' y de la oferta' : ''}?

${offer ? 'Considera específicamente qué tan bien el CV se alinea con los requisitos de la oferta.' : ''}

Devuelve ÚNICAMENTE el JSON válido, sin markdown, sin explicaciones adicionales.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Limpiar posible formato markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : text;

    const analysis = JSON.parse(jsonString);

    // Validar estructura
    if (typeof analysis.overallScore !== 'number' || !Array.isArray(analysis.observations)) {
      throw new Error('La respuesta de la IA no tiene el formato esperado');
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing CV with AI:', error);
    throw new Error('No se pudo completar el análisis del CV. Intenta de nuevo más tarde.');
  }
};

const saveAnalysis = async (studentId, resumeId, offerId, analysisData) => {
  const analysis = await CVAnalysis.create({
    studentId,
    resumeId,
    offerId,
    overallScore: analysisData.overallScore,
    sectionScores: analysisData.sectionScores,
    observations: analysisData.observations,
    recommendations: analysisData.recommendations,
    keywordsAnalysis: analysisData.keywordsAnalysis,
    improvedCv: analysisData.improvedCv,
  });

  // Actualizar el score del CV principal
  if (resumeId) {
    await Resume.update(
      { aiScore: analysisData.overallScore },
      { where: { id: resumeId } }
    );
  }

  return analysis;
};

const getAnalysisHistory = async (studentId, limit = 20) => {
  const analyses = await CVAnalysis.findAll({
    where: { studentId },
    include: [
      {
        model: Offer,
        as: 'offer',
        include: [{ model: Company, as: 'company', attributes: ['id', 'legalName', 'logoUrl'] }],
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
  });

  return analyses.map((analysis) => {
    const parsed = parseAnalysisFields(analysis);
    return {
      id: analysis.id,
      overallScore: analysis.overallScore,
      sectionScores: parsed.sectionScores,
      offer: analysis.offer
        ? {
            id: analysis.offer.id,
            title: analysis.offer.title,
            company: analysis.offer.company,
          }
        : null,
      createdAt: analysis.created_at,
      summary: parsed.observations?.slice(0, 3) || [],
    };
  });
};

const getAnalysisById = async (analysisId, studentId) => {
  const analysis = await CVAnalysis.findOne({
    where: { id: analysisId, studentId },
    include: [
      {
        model: Offer,
        as: 'offer',
        include: [{ model: Company, as: 'company', attributes: ['id', 'legalName', 'logoUrl'] }],
      },
    ],
  });

  if (!analysis) {
    throw new Error('Análisis no encontrado');
  }

  const parsed = parseAnalysisFields(analysis);
  return {
    id: analysis.id,
    overallScore: analysis.overallScore,
    sectionScores: parsed.sectionScores,
    scoreCategory: getScoreCategory(analysis.overallScore),
    observations: parsed.observations,
    recommendations: parsed.recommendations,
    keywordsAnalysis: parsed.keywordsAnalysis,
    improvedCv: parsed.improvedCv,
    offer: analysis.offer
      ? {
          id: analysis.offer.id,
          title: analysis.offer.title,
          company: analysis.offer.company,
        }
      : null,
    createdAt: analysis.created_at,
  };
};

const analyzeAndSave = async (studentId, offerId = null) => {
  // Obtener el CV del estudiante
  const resumeInstance = await Resume.findOne({
    where: { studentId },
    include: [{ model: Student, as: 'student' }],
  });

  if (!resumeInstance) {
    throw new Error('No se encontró un CV para analizar');
  }

  // Parsear JSON defensivamente para evitar campos vacíos si vienen como strings
  const resume = parsePlainResume(resumeInstance.toJSON ? resumeInstance.toJSON() : resumeInstance);

  // Si se especifica una oferta, obtener sus detalles
  let offer = null;
  let company = null;
  if (offerId) {
    offer = await Offer.findByPk(offerId, {
      include: [{ model: Company, as: 'company' }],
    });
    if (!offer) {
      throw new Error('La oferta especificada no existe');
    }
    company = offer.company;
  }

  // Realizar análisis con IA
  const resumeText = formatResumeForAnalysis(resume);
  console.log('[cvAnalysisService] Texto formateado del CV (longitud):', resumeText.length);
  console.log('[cvAnalysisService] Primeros 500 chars:', resumeText.slice(0, 500));
  const analysisData = await analyzeCVWithAI(resume, offer, company);

  // Guardar el análisis
  const savedAnalysis = await saveAnalysis(
    studentId,
    resume.id,
    offerId,
    analysisData
  );

  return {
    analysisId: savedAnalysis.id,
    overallScore: analysisData.overallScore,
    scoreCategory: getScoreCategory(analysisData.overallScore),
    sectionScores: analysisData.sectionScores,
    observations: analysisData.observations,
    recommendations: analysisData.recommendations,
    keywordsAnalysis: analysisData.keywordsAnalysis,
    improvedCv: analysisData.improvedCv,
    offer: offer
      ? {
          id: offer.id,
          title: offer.title,
          company: company
            ? { id: company.id, legalName: company.legalName }
            : null,
        }
      : null,
  };
};

const deleteAnalysis = async (analysisId, studentId) => {
  const analysis = await CVAnalysis.findOne({
    where: { id: analysisId, studentId },
  });

  if (!analysis) {
    throw new Error('Análisis no encontrado');
  }

  await analysis.destroy();
  return { message: 'Análisis eliminado correctamente' };
};

module.exports = {
  analyzeAndSave,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis,
  getScoreCategory,
  SCORE_RANGES,
};
