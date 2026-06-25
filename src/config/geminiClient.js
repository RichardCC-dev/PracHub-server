const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Nombres de modelos Gemini centralizados.
 * Cambiar aquí afecta a todos los servicios de IA del proyecto.
 *
 * @property {string} FLASH_2_5      - Modelo estable GA para mejoras de texto en CVs (aiService).
 * @property {string} FLASH_2_5  - Modelo con razonamiento extendido para simulaciones (geminiService).
 * @property {string} FLASH_LITE - Modelo ligero para análisis masivos de CVs (cvAnalysisService).
 */
const GEMINI_MODELS = {
  FLASH_2_5: 'gemini-2.5-flash',
  FLASH_LITE: 'gemini-2.5-flash-lite',
};

/**
 * Cliente Gemini singleton compartido por todos los servicios de IA.
 * Se inicializa una sola vez con la API key de la variable de entorno.
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

module.exports = { genAI, GEMINI_MODELS };
