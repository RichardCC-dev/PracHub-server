// --- Mock del cliente Gemini (factory inline para evitar TDZ de hoisting) ---
jest.mock('../src/config/geminiClient', () => ({
  genAI: { getGenerativeModel: jest.fn() },
  GEMINI_MODELS: {
    FLASH: 'gemini-2.0-flash',
    FLASH_2_5: 'gemini-2.5-flash',
    FLASH_LITE: 'gemini-2.5-flash-lite',
  },
}));

// --- Mock de modelos Sequelize (factory inline) ---
jest.mock('../src/models', () => ({
  Resume: { findOne: jest.fn(), update: jest.fn() },
  Offer: { findByPk: jest.fn(), findAll: jest.fn() },
  CVAnalysis: { create: jest.fn(), findOne: jest.fn(), findAll: jest.fn() },
  Student: { findByPk: jest.fn(), findAll: jest.fn() },
  Company: { findByPk: jest.fn() },
}));

const { genAI } = require('../src/config/geminiClient');
const models = require('../src/models');
const cvAnalysisService = require('../src/services/cvAnalysisService');

// Helper: configura el mock del modelo para generateContent
const setupModelMock = (generateContentImpl) => {
  genAI.getGenerativeModel.mockReturnValue({ generateContent: generateContentImpl });
};

const validAnalysis = {
  overallScore: 85,
  sectionScores: { clarity: 90, impact: 80, grammar: 85, length: 80, keywords: 90 },
  observations: [{ section: 'profile', type: 'strength', message: 'Perfil claro' }],
  recommendations: ['Agrega métricas'],
  keywordsAnalysis: { matched: ['react'], missing: ['sql'], suggestions: ['sql'] },
  improvedCv: { profile: { summary: 'mejorado' } },
};

const sampleResume = (overrides = {}) => ({
  id: 1,
  studentId: 10,
  toJSON() {
    return {
      id: 1,
      studentId: 10,
      profile: { summary: 'Estudiante de ingeniería' },
      personal: { name: 'Juan' },
      education: { items: [{ degree: 'BS', institution: 'UNI', startDate: '2020', endDate: '2024' }] },
      experience: { items: [{ role: 'Dev', company: 'X', description: 'Hice cosas' }] },
      skills: { areas: [{ area: 'Frontend', skills: 'React' }], soft: 'Comunicación' },
      ...overrides,
    };
  },
});

describe('cvAnalysisService — análisis de CV con Gemini FLASH_LITE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupModelMock(
      jest.fn().mockResolvedValue({
        response: { text: () => JSON.stringify(validAnalysis) },
      })
    );
  });

  describe('getScoreCategory / SCORE_RANGES (funciones puras)', () => {
    it('clasifica scores en los 4 rangos correctamente', () => {
      const { getScoreCategory, SCORE_RANGES } = cvAnalysisService;

      expect(getScoreCategory(85).label).toBe('Excelente');
      expect(getScoreCategory(80).label).toBe('Excelente');
      expect(getScoreCategory(70).label).toBe('Bueno');
      expect(getScoreCategory(60).label).toBe('Bueno');
      expect(getScoreCategory(50).label).toBe('Necesita mejoras');
      expect(getScoreCategory(40).label).toBe('Necesita mejoras');
      expect(getScoreCategory(30).label).toBe('Requiere trabajo significativo');
      expect(getScoreCategory(0).label).toBe('Requiere trabajo significativo');
    });

    it('expone SCORE_RANGES con min/max/color por rango', () => {
      const { SCORE_RANGES } = cvAnalysisService;
      expect(SCORE_RANGES.excellent).toEqual({ min: 80, max: 100, label: 'Excelente', color: 'green' });
      expect(SCORE_RANGES.poor.min).toBe(0);
    });
  });

  describe('analyzeAndSave', () => {
    it('usa el modelo FLASH_LITE y devuelve el análisis estructurado', async () => {
      models.Resume.findOne.mockResolvedValue(sampleResume());
      models.CVAnalysis.create.mockResolvedValue({ id: 99 });
      models.Resume.update.mockResolvedValue([1]);

      const result = await cvAnalysisService.analyzeAndSave(10, null);

      expect(genAI.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-2.5-flash-lite' });
      expect(result.overallScore).toBe(85);
      expect(result.scoreCategory.label).toBe('Excelente');
      expect(result.sectionScores.clarity).toBe(90);
      expect(result.observations).toHaveLength(1);
      expect(result.offer).toBeNull();
      expect(models.Resume.update).toHaveBeenCalledWith(
        { aiScore: 85 },
        { where: { id: 1 } }
      );
    });

    it('lanza error si el estudiante no tiene CV', async () => {
      models.Resume.findOne.mockResolvedValue(null);

      await expect(cvAnalysisService.analyzeAndSave(10, null)).rejects.toThrow(
        'No se encontró un CV para analizar'
      );
    });

    it('lanza error si la oferta especificada no existe', async () => {
      models.Resume.findOne.mockResolvedValue(sampleResume());
      models.Offer.findByPk.mockResolvedValue(null);

      await expect(cvAnalysisService.analyzeAndSave(10, 55)).rejects.toThrow(
        'La oferta especificada no existe'
      );
    });

    it('incluye el contexto de la oferta en el prompt cuando se provee offerId', async () => {
      models.Resume.findOne.mockResolvedValue(sampleResume());
      models.Offer.findByPk.mockResolvedValue({
        id: 55,
        title: 'Practicante Data',
        area: 'Data',
        description: 'desc',
        requirements: 'req',
        modality: 'remoto',
        careerTags: ['Ingeniería'],
        company: { legalName: 'BCP' },
      });
      models.CVAnalysis.create.mockResolvedValue({ id: 100 });
      models.Resume.update.mockResolvedValue([1]);

      const generateContent = jest.fn().mockResolvedValue({
        response: { text: () => JSON.stringify(validAnalysis) },
      });
      setupModelMock(generateContent);

      await cvAnalysisService.analyzeAndSave(10, 55);

      const prompt = generateContent.mock.calls[0][0];
      expect(prompt).toContain('Practicante Data');
      expect(prompt).toContain('BCP');
      expect(prompt).toContain('alinea con los requisitos de la oferta');
    });

    it('lanza error amigable cuando la IA devuelve JSON inválido', async () => {
      models.Resume.findOne.mockResolvedValue(sampleResume());
      setupModelMock(
        jest.fn().mockResolvedValue({ response: { text: () => 'no es json' } })
      );

      await expect(cvAnalysisService.analyzeAndSave(10, null)).rejects.toThrow(
        'No se pudo completar el análisis del CV. Intenta de nuevo más tarde.'
      );
    });

    it('lanza error cuando la IA devuelve JSON sin la estructura esperada', async () => {
      models.Resume.findOne.mockResolvedValue(sampleResume());
      // Falta overallScore numérico y observations array
      setupModelMock(
        jest.fn().mockResolvedValue({
          response: { text: () => JSON.stringify({ overallScore: 'no-num', observations: 'no-array' }) },
        })
      );

      await expect(cvAnalysisService.analyzeAndSave(10, null)).rejects.toThrow(
        'No se pudo completar el análisis del CV. Intenta de nuevo más tarde.'
      );
    });

    it('limpia fences ```json de la respuesta antes de parsear', async () => {
      models.Resume.findOne.mockResolvedValue(sampleResume());
      models.CVAnalysis.create.mockResolvedValue({ id: 101 });
      models.Resume.update.mockResolvedValue([1]);
      setupModelMock(
        jest.fn().mockResolvedValue({
          response: { text: () => '```json\n' + JSON.stringify(validAnalysis) + '\n```' },
        })
      );

      const result = await cvAnalysisService.analyzeAndSave(10, null);
      expect(result.overallScore).toBe(85);
    });
  });

  describe('getAnalysisById', () => {
    it('lanza error si el análisis no pertenece al estudiante', async () => {
      models.CVAnalysis.findOne.mockResolvedValue(null);

      await expect(cvAnalysisService.getAnalysisById(999, 10)).rejects.toThrow(
        'Análisis no encontrado'
      );
    });

    it('devuelve el análisis parseado con scoreCategory', async () => {
      models.CVAnalysis.findOne.mockResolvedValue({
        id: 5,
        overallScore: 65,
        sectionScores: JSON.stringify({ clarity: 60 }),
        observations: JSON.stringify([{ section: 'x', type: 'improvement', message: 'y' }]),
        recommendations: JSON.stringify(['r1']),
        keywordsAnalysis: JSON.stringify({ matched: [] }),
        improvedCv: JSON.stringify({}),
        offer: { id: 1, title: 'T', company: { id: 2, legalName: 'C' } },
        created_at: new Date('2026-01-01'),
      });

      const result = await cvAnalysisService.getAnalysisById(5, 10);
      expect(result.overallScore).toBe(65);
      expect(result.scoreCategory.label).toBe('Bueno');
      expect(result.sectionScores.clarity).toBe(60);
      expect(result.observations).toHaveLength(1);
    });
  });

  describe('deleteAnalysis', () => {
    it('elimina el análisis cuando existe', async () => {
      const destroy = jest.fn();
      models.CVAnalysis.findOne.mockResolvedValue({ destroy });

      const result = await cvAnalysisService.deleteAnalysis(5, 10);

      expect(destroy).toHaveBeenCalled();
      expect(result.message).toBe('Análisis eliminado correctamente');
    });

    it('lanza error si el análisis no existe', async () => {
      models.CVAnalysis.findOne.mockResolvedValue(null);

      await expect(cvAnalysisService.deleteAnalysis(5, 10)).rejects.toThrow(
        'Análisis no encontrado'
      );
    });
  });
});
