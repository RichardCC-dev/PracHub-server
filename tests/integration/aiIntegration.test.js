/**
 * Tests de integración de los servicios de IA con la API real de Google Gemini.
 *
 * Se ejecutan SOLO cuando están presentes GEMINI_API_KEY y RUN_AI_INTEGRATION=true,
 * para no gastar cuota en cada run de CI ni romper el pipeline sin credenciales.
 *
 * Uso local:
 *   cd server
 *   # asegúrate de tener GEMINI_API_KEY en .env
 *   $env:RUN_AI_INTEGRATION='true'; npm test -- tests/integration/aiIntegration.test.js
 */

const RUN_INTEGRATION =
  process.env.GEMINI_API_KEY && process.env.RUN_AI_INTEGRATION === 'true';

const describeIntegration = RUN_INTEGRATION ? describe : describe.skip;

// Cargar variables de .env para que geminiClient tenga la API key real
if (RUN_INTEGRATION) {
  require('dotenv').config();
}

const aiService = require('../../src/services/aiService');
const geminiService = require('../../src/services/geminiService');

// Para cvAnalysisService: usamos Gemini real pero mockeamos la BD (factory inline)
jest.mock('../../src/models', () => ({
  Resume: { findOne: jest.fn(), update: jest.fn() },
  Offer: { findByPk: jest.fn() },
  CVAnalysis: { create: jest.fn() },
  Student: {},
  Company: {},
}));

const models = require('../../src/models');
const cvAnalysisService = require('../../src/services/cvAnalysisService');

const fixtureResume = {
  id: 1,
  studentId: 10,
  toJSON() {
    return {
      id: 1,
      studentId: 10,
      profile: { summary: 'Estudiante de Ingeniería de Sistemas interesado en desarrollo backend.' },
      personal: { name: 'Juan Pérez' },
      education: {
        items: [{ degree: 'Bachiller en Ingeniería', institution: 'UNI', startDate: '2021', endDate: '2025' }],
      },
      experience: {
        items: [{ role: 'Practicante', company: 'Startup X', description: 'Desarrollé APIs REST con Node.js.' }],
      },
      skills: { areas: [{ area: 'Backend', skills: 'Node.js, Express, SQL' }], soft: 'Trabajo en equipo' },
    };
  },
};

describeIntegration('Integración real con Gemini API', () => {
  beforeAll(() => {
    jest.setTimeout(60000);
  });

  describe('aiService (modelo FLASH)', () => {
    it('improveText devuelve texto mejorado no vacío', async () => {
      const result = await aiService.improveText({
        section: 'profile',
        field: 'summary',
        content: 'Soy estudiante y me gusta programar.',
      });

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('improveSection devuelve un JSON válido para la sección profile', async () => {
      const result = await aiService.improveSection({
        section: 'profile',
        data: { summary: 'Estudiante de ingeniería.' },
      });

      expect(result).toEqual(expect.objectContaining({ summary: expect.any(String) }));
    });
  });

  describe('geminiService (modelo FLASH_2_5)', () => {
    it('chatWithGemini responde como el reclutador "Marco"', async () => {
      const reply = await geminiService.chatWithGemini(
        [],
        'Desarrollador Backend',
        'Hola, soy Juan y me motiva crear software.',
        'Ingeniería de Sistemas',
        'Tecnología'
      );

      expect(typeof reply).toBe('string');
      expect(reply.length).toBeGreaterThan(0);
    });

    it('generateSimulationSummary devuelve overallScore 0-100 y feedbackSummary', async () => {
      const result = await geminiService.generateSimulationSummary([
        { role: 'ai', content: '¿Cuéntame sobre tu experiencia con Node.js?' },
        { role: 'user', content: 'Desarrollé varias APIs REST usando Express y Sequelize en un proyecto universitario, integrando autenticación JWT y tests con Jest.' },
      ]);

      expect(typeof result.overallScore).toBe('number');
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.feedbackSummary).toBeDefined();
    });
  });

  describe('cvAnalysisService (modelo FLASH_LITE)', () => {
    it('analyzeAndSave devuelve un análisis estructurado válido desde la IA real', async () => {
      models.Resume.findOne.mockResolvedValue(fixtureResume);
      models.CVAnalysis.create.mockResolvedValue({ id: 1 });
      models.Resume.update.mockResolvedValue([1]);

      const result = await cvAnalysisService.analyzeAndSave(10, null);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.sectionScores).toEqual(expect.objectContaining({ clarity: expect.any(Number) }));
      expect(Array.isArray(result.observations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.keywordsAnalysis).toEqual(expect.objectContaining({}));
    });
  });
});

if (!RUN_INTEGRATION) {
  describe('Integración real con Gemini API', () => {
    it('se omite cuando RUN_AI_INTEGRATION != true o no hay GEMINI_API_KEY', () => {
      // Placeholder informativo: los tests reales están skip-e arriba.
      expect(true).toBe(true);
    });
  });
}
