const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa el cliente de Gemini con la API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getSystemPrompt = (role, career, sector) => {
  const contextInfo = career ? `El candidato estudia ${career}` : 'El candidato es universitario';
  const sectorInfo = sector ? ` y quiere trabajar en el sector de ${sector}` : '';
  return `Eres un reclutador senior llamado "Marco" de una empresa reconocida tienes que especificar la empresa y el empleo que ofreces. Estás entrevistando a un candidato para prácticas profesionales en el área de ${role}. ${contextInfo}${sectorInfo}.

TU AGENDA DE ENTREVISTA (sigue este orden, avanza al siguiente bloque después de 1-2 respuestas por tema):
1. Presentación y motivación: por qué le interesa el rol y la empresa.
2. Experiencia y proyectos: qué ha hecho relevante, con ejemplos concretos (pide método STAR).
3. Habilidades técnicas o conocimientos clave del área de ${role}.
4. Trabajo en equipo y comunicación: cómo colabora, cómo maneja conflictos.
5. Manejo de problemas o situaciones difíciles: un ejemplo real de cuando algo salió mal.
6. Metas profesionales: dónde se ve a mediano plazo, qué quiere aprender.

REGLAS DE CONVERSACIÓN (MUY IMPORTANTES):
- Sigue el orden de la agenda. NO te quedes en el mismo tema más de 2 respuestas seguidas.
- Cuando ya tienes suficiente sobre un tema, di algo como "Entendido, cambiemos de tema." y pasa al siguiente.
- Habla de forma natural y humana. Nada de listas ni formato markdown en tus respuestas.
- Haz UNA sola pregunta a la vez, corta y directa (máximo 2 oraciones).
- Después de cada respuesta: un comentario breve y honesto (1 oración máximo), luego la siguiente pregunta.
- Si la respuesta es muy vaga, pide un ejemplo: "¿Puedes darme un caso concreto?"
- Tono: profesional pero directo. No uses "¡Excelente!" ni frases condescendientes.
- NUNCA generes una respuesta vacía.`;
};

const ensureArray = (historyData) => {
  if (Array.isArray(historyData)) return historyData;
  if (typeof historyData === 'string') {
    try {
      return JSON.parse(historyData || '[]');
    } catch (e) {
      console.error('Error parseando chatHistory en el servidor:', e);
      return [];
    }
  }
  return [];
};

const chatWithGemini = async (chatHistory, simulatedRole, newMessage, career, sector) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const safeChatHistory = ensureArray(chatHistory);

  // Filtramos solo mensajes con contenido real (excluye system prompt y vacíos)
  const visibleHistory = safeChatHistory.filter(msg => msg.content && msg.content.trim() !== '');

  let history = visibleHistory.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Siempre inyectamos el system prompt al inicio como primer turno user/model
  const systemTurns = [
    { role: 'user', parts: [{ text: getSystemPrompt(simulatedRole, career, sector) }] },
    { role: 'model', parts: [{ text: `Hola, soy Marco. Gracias por tomarte el tiempo. Para la posición de ${simulatedRole}, te haré algunas preguntas para conocerte mejor. Para empezar, ¿puedes presentarte brevemente y contarme qué te motivó a postular a esta área?` }] }
  ];

  // Si el historial ya tiene turnos propios, solo añadimos los system turns al inicio
  if (history.length === 0) {
    history = [...systemTurns];
  } else {
    history = [...systemTurns, ...history];
  }

  // --- SOLUCIÓN AL ERROR 400: Filtro de alternancia estricta ---
  let sanitizedHistory = [];
  let expectedRole = 'user';

  for (let i = 0; i < history.length; i++) {
    if (history[i].role === expectedRole) {
      sanitizedHistory.push(history[i]);
      // Alternamos el rol esperado
      expectedRole = expectedRole === 'user' ? 'model' : 'user';
    }
  }

  // Si el historial limpio termina en 'user', significa que la última vez hubo un error 
  // y la IA no respondió. Como vamos a mandar un newMessage (que es otro 'user'),
  // debemos quitar ese último 'user' del historial para no romper la regla de Google.
  if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
    sanitizedHistory.pop();
  }
  // -------------------------------------------------------------

  const chat = model.startChat({
    history: sanitizedHistory,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
    },
  });

  // Extrae el retryDelay sugerido por Gemini desde el error (en segundos)
  const getRetryDelay = (err) => {
    try {
      const retryInfo = err.errorDetails?.find(d => d['@type']?.includes('RetryInfo'));
      if (retryInfo?.retryDelay) {
        const seconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10);
        return isNaN(seconds) ? 30000 : (seconds + 2) * 1000;
      }
    } catch (_) {}
    return 30000;
  };

  // Un solo reintento respetando el retryDelay real de la API
  const sendWithRetry = async (retries = 1) => {
    try {
      const result = await chat.sendMessage(newMessage);
      return result.response.text();
    } catch (err) {
      if (err.status === 429 && retries > 0) {
        const delay = getRetryDelay(err);
        console.warn(`Gemini 429 - reintentando en ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendWithRetry(retries - 1);
      }
      throw err;
    }
  };

  return sendWithRetry();
};

// Fallback local cuando Gemini no está disponible (429/503)
const generateFallbackSummary = (chatHistory) => {
  const safeChatHistory = ensureArray(chatHistory);
  const userMessages = safeChatHistory.filter(m => m.role === 'user');
  const totalUserWords = userMessages.reduce((acc, m) => acc + (m.content || '').split(' ').length, 0);
  const avgWordsPerAnswer = userMessages.length > 0 ? totalUserWords / userMessages.length : 0;

  // Scoring heurístico simple basado en cantidad y extensión de respuestas
  let score = 50;
  if (userMessages.length >= 6) score += 10;
  if (userMessages.length >= 10) score += 5;
  if (avgWordsPerAnswer >= 40) score += 10;
  if (avgWordsPerAnswer >= 80) score += 10;
  if (avgWordsPerAnswer < 15) score -= 15;
  score = Math.max(30, Math.min(score, 78)); // cap entre 30-78 para fallback

  return {
    overallScore: score,
    feedbackSummary: `Análisis generado localmente (servicio de IA temporalmente no disponible). Se registraron ${userMessages.length} respuestas con un promedio de ${Math.round(avgWordsPerAnswer)} palabras por respuesta. Para obtener retroalimentación detallada personalizada, intenta finalizar la sesión nuevamente en unos minutos cuando el servicio esté disponible.`
  };
};

const generateSimulationSummary = async (chatHistory) => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const safeChatHistory = ensureArray(chatHistory);
  
  const formattedHistory = safeChatHistory
    .filter(msg => msg.content && msg.content.trim())
    .map(msg => `${msg.role === 'ai' ? 'Entrevistador' : 'Candidato'}: ${msg.content}`)
    .join('\n');
  
  const prompt = `Actúa como un Headhunter estricto evaluando la siguiente transcripción de entrevista para prácticas:

${formattedHistory}

Genera un resumen crítico del desempeño del candidato en formato JSON estricto con la siguiente estructura:
{
  "overallScore": <número del 0 al 100>,
  "feedbackSummary": "<texto con retroalimentación general detallada>"
}

Reglas estrictas de evaluación:
- Sé riguroso. Penaliza respuestas genéricas, falta del método STAR y falta de impacto real. Un candidato promedio debe rondar los 60-70 puntos. Solo un talento excepcional obtiene más de 85.
- El "feedbackSummary" debe ser un solo párrafo de 3 a 4 oraciones precisas destacando los puntos fuertes demostrados y, de manera crítica, sus áreas débiles o falta de profundidad. No uses listas, usa un párrafo directo y profesional. Ademas de si sus repuestas les falta mas capacidad de comunicacion o no va al punto.`;

  // Reintento con backoff si hay 429
  const tryGenerate = async (retries = 2, delayMs = 20000) => {
    try {
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (err) {
      if (err.status === 429 && retries > 0) {
        console.warn(`Gemini 429 en summary - reintentando en ${delayMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return tryGenerate(retries - 1, delayMs);
      }
      // Si se agotaron reintentos o es otro error, usamos fallback local
      console.error('Error en generateSimulationSummary, usando fallback local:', err.message);
      return generateFallbackSummary(chatHistory);
    }
  };

  return tryGenerate();
};

module.exports = {
  chatWithGemini,
  generateSimulationSummary
};