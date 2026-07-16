const { genAI, GEMINI_MODELS } = require('../config/geminiClient');
const logger = require('../utils/logger');

// Extrae y parsea JSON de la respuesta de Gemini, que puede venir
// envuelta en bloques markdown (```json ... ```) o con texto explicativo.
const parseJsonResponse = (raw) => {
  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : cleaned;

  const parsed = JSON.parse(jsonString);
  return stripMarkdownFromValues(parsed);
};

// Elimina marcadores markdown (**bold**, *italic*, __bold__) de los valores
// string dentro del objeto JSON devuelto por Gemini, recursivamente.
const stripMarkdownFromValues = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(stripMarkdownFromValues);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, stripMarkdownFromValues(v)])
    );
  }
  return value;
};

const improveText = async ({ section, field, content }) => {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.FLASH_2_5 });

    const prompt = `Eres un experto en redacción de CVs para estudiantes universitarios. Mejora el siguiente texto para la sección "${section}" y campo "${field}". Devuelve SOLO el texto mejorado, sin explicaciones ni formato adicional.

Texto original:
${content}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const improved = response.text();

    return improved.trim();
  } catch (error) {
    logger.error('AI service error:', error);
    throw new Error('No se pudo generar la sugerencia en este momento.');
  }
};

const improveSection = async ({ section, data }) => {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODELS.FLASH_2_5 });

    let dataText = '';

    // Manejar perfil profesional
    if (section === 'profile') {
      dataText = data.summary || '';
    } else if (section === 'experience' && data.items && Array.isArray(data.items)) {
      dataText = data.items
        .filter(item => Object.values(item).some(v => v && v.trim() !== ''))
        .map((item, index) =>
          `Experiencia ${index + 1}:\nEmpresa: ${item.company || ''}\nRol: ${item.role || ''}\nDescripción: ${item.description || ''}`
        )
        .join('\n\n');
    } else if (section === 'projects' && data.items && Array.isArray(data.items)) {
      dataText = data.items
        .filter(item =>
          (item.title && item.title.trim()) ||
          (Array.isArray(item.bullets) ? item.bullets.some(b => b && b.trim()) : (item.description && item.description.trim()))
        )
        .map((item, index) => {
          const bullets = Array.isArray(item.bullets)
            ? item.bullets.filter(b => b && b.trim())
            : (item.description ? [item.description] : []);
          return `Proyecto ${index + 1}:\nTítulo: ${item.title || ''}\nViñetas:\n${bullets.map(b => `- ${b}`).join('\n')}`;
        })
        .join('\n\n');
    } else if (section === 'skills') {
      const areas = Array.isArray(data.areas) ? data.areas : [];
      const areasText = areas
        .filter(a => (a.area && a.area.trim()) || (a.skills && a.skills.trim()))
        .map((a, index) => `Área ${index + 1}:\nNombre: ${a.area || ''}\nHabilidades: ${a.skills || ''}`)
        .join('\n\n');
      dataText = `Habilidades técnicas:\n${areasText}\n\nHabilidades blandas: ${data.soft || ''}`;
    } else {
      // Para secciones normales
      dataText = Object.entries(data)
        .filter(([_, value]) => value && typeof value === 'string' && value.trim() !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }

    let jsonStructure;
    if (section === 'profile') {
      jsonStructure = 'Devuelve SOLO un objeto JSON con esta estructura exacta: {"summary": "..."}';
    } else if (section === 'skills') {
      jsonStructure = 'Devuelve SOLO un objeto JSON con esta estructura exacta: {"areas": [{"area": "...", "skills": "..."}], "soft": "..."}';
    } else if (section === 'experience') {
      jsonStructure = 'Devuelve SOLO un objeto JSON con esta estructura exacta: {"items": [{"company": "...", "role": "...", "description": "..."}]}';
    } else if (section === 'projects') {
      jsonStructure = 'Devuelve SOLO un objeto JSON con esta estructura exacta: {"items": [{"title": "...", "bullets": ["viñeta 1", "viñeta 2"]}]}';
    } else {
      jsonStructure = 'Devuelve SOLO un objeto JSON con los campos mejorados';
    }

const prompt = `Eres un experto en redacción de CVs para estudiantes universitarios. Mejora la siguiente sección "${section}" manteniendo todos los campos. 

${jsonStructure}. Sin explicaciones ni formato adicional.

Datos originales:
${dataText}`;

    let improvedText;
    try {
      const result = await model.generateContent(prompt);
      improvedText = result.response.text();
    } catch (error) {
      logger.error('AI service error:', error);
      throw new Error('No se pudo generar la sugerencia en este momento.');
    }

    try {
      return parseJsonResponse(improvedText);
    } catch (error) {
      logger.error('AI service error: respuesta no parseable como JSON', { raw: improvedText, error: error.message });
      throw new Error('La IA no devolvió un formato válido. Intenta de nuevo.');
    }
  } catch (error) {
    // Re-lanzar errores ya conocidos (formato válido / sugerencia) sin enmascararlos
    if (error.message === 'La IA no devolvió un formato válido. Intenta de nuevo.' ||
        error.message === 'No se pudo generar la sugerencia en este momento.') {
      throw error;
    }
    logger.error('AI service error:', error);
    throw new Error('No se pudo generar la sugerencia en este momento.');
  }
};

module.exports = {
  improveText,
  improveSection,
};
