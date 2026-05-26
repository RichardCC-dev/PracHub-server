const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const improveText = async ({ section, field, content }) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `Eres un experto en redacción de CVs para estudiantes universitarios. Mejora el siguiente texto para la sección "${section}" y campo "${field}". Devuelve SOLO el texto mejorado, sin explicaciones ni formato adicional.

Texto original:
${content}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const improved = response.text();

    return improved.trim();
  } catch (error) {
    console.error('AI service error:', error.message);
    throw new Error('No se pudo generar la sugerencia en este momento.');
  }
};

const improveSection = async ({ section, data }) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    let dataText = '';
    
    // Manejar secciones con arrays (experiencia, proyectos)
    if (section === 'experience' && data.items && Array.isArray(data.items)) {
      dataText = data.items
        .filter(item => Object.values(item).some(v => v && v.trim() !== ''))
        .map((item, index) => 
          `Experiencia ${index + 1}:\nEmpresa: ${item.company || ''}\nRol: ${item.role || ''}\nDescripción: ${item.description || ''}`
        )
        .join('\n\n');
    } else if (section === 'projects' && data.items && Array.isArray(data.items)) {
      dataText = data.items
        .filter(item => Object.values(item).some(v => v && v.trim() !== ''))
        .map((item, index) => 
          `Proyecto ${index + 1}:\nTítulo: ${item.title || ''}\nDescripción: ${item.description || ''}`
        )
        .join('\n\n');
    } else {
      // Para secciones normales
      dataText = Object.entries(data)
        .filter(([_, value]) => value && value.trim() !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }

    let jsonStructure;
if (section === 'experience') {
  jsonStructure = 'Devuelve SOLO un objeto JSON con esta estructura exacta: {"items": [{"company": "...", "role": "...", "description": "..."}]}';
} else if (section === 'projects') {
  jsonStructure = 'Devuelve SOLO un objeto JSON con esta estructura exacta: {"items": [{"title": "...", "description": "..."}]}';
} else {
  jsonStructure = 'Devuelve SOLO un objeto JSON con los campos mejorados';
}

const prompt = `Eres un experto en redacción de CVs para estudiantes universitarios. Mejora la siguiente sección "${section}" manteniendo todos los campos. 

${jsonStructure}. Sin explicaciones ni formato adicional.

Datos originales:
${dataText}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const improvedText = response.text();

    // Intentar parsear como JSON, si falla, devolver texto plano
    try {
      return JSON.parse(improvedText);
    } catch {
      throw new Error('La IA no devolvió un formato válido. Intenta de nuevo.');
    }
  } catch (error) {
    console.error('AI service error:', error.message);
    throw new Error('No se pudo generar la sugerencia en este momento.');
  }
};

module.exports = {
  improveText,
  improveSection,
};
