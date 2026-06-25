// Mock de modelos Sequelize (factory inline para evitar TDZ de hoisting)
jest.mock('../src/models', () => ({
  Resume: { findOne: jest.fn() },
  Offer: { findAll: jest.fn() },
  Student: {},
  Company: {},
}));

const models = require('../src/models');
const recommendationService = require('../src/services/recommendationService');

// `natural` se resuelve al mock global (tests/__mocks__/natural.js) via jest.config.
// Para los tests de motor TF-IDF probamos las funciones puras y la orquestación
// con stubs controlados, evitando depender del mock ESM vacío.

describe('recommendationService — motor TF-IDF + similitud coseno (no Gemini)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cosineSimilarity (matemática pura)', () => {
    it('devuelve 1 para vectores idénticos', () => {
      const v = { a: 1, b: 2, c: 3 };
      expect(recommendationService.cosineSimilarity(v, v)).toBeCloseTo(1, 5);
    });

    it('devuelve 0 para vectores ortogonales', () => {
      expect(recommendationService.cosineSimilarity({ a: 1 }, { b: 1 })).toBe(0);
    });

    it('devuelve 0 cuando uno de los vectores es nulo (norma 0)', () => {
      expect(recommendationService.cosineSimilarity({}, { a: 1 })).toBe(0);
      expect(recommendationService.cosineSimilarity({ a: 1 }, {})).toBe(0);
    });

    it('calcula correctamente la similitud para vectores generales', () => {
      // vec1 = {a:1, b:0}, vec2 = {a:0, b:1} -> ortogonal = 0
      // vec1 = {a:1, b:1}, vec2 = {a:1, b:1} -> 1
      // vec1 = {a:1, b:0}, vec2 = {a:1, b:1} -> 1/sqrt(2)
      const sim = recommendationService.cosineSimilarity({ a: 1, b: 0 }, { a: 1, b: 1 });
      expect(sim).toBeCloseTo(1 / Math.sqrt(2), 5);
    });
  });

  describe('getTfIdfVector', () => {
    it('construye un vector término->tfidf desde listTerms', () => {
      const fakeTfidf = {
        listTerms: jest.fn(() => [
          { term: 'react', tfidf: 0.5 },
          { term: 'node', tfidf: 0.3 },
        ]),
      };

      const vector = recommendationService.getTfIdfVector(fakeTfidf, 0);

      expect(vector).toEqual({ react: 0.5, node: 0.3 });
      expect(fakeTfidf.listTerms).toHaveBeenCalledWith(0);
    });

    it('devuelve un objeto vacío cuando no hay términos', () => {
      const fakeTfidf = { listTerms: jest.fn(() => []) };
      expect(recommendationService.getTfIdfVector(fakeTfidf, 1)).toEqual({});
    });
  });

  describe('calculateSimilarityScores (umbral + ordenamiento)', () => {
    it('filtra ofertas bajo el umbral (40) y ordena desc por matchScore', async () => {
      const offers = [
        { id: 1, title: 'A' },
        { id: 2, title: 'B' },
        { id: 3, title: 'C' },
      ];

      // Stub de cosineSimilarity para scores controlados: 0.9, 0.3, 0.5
      const cosSpy = jest
        .spyOn(recommendationService, 'cosineSimilarity')
        .mockReturnValue(0.9)
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.5);

      const results = await recommendationService.calculateSimilarityScores('student text', offers);

      // 0.9->90, 0.3->30 (filtrado), 0.5->50
      expect(results).toHaveLength(2);
      expect(results[0].matchScore).toBe(90);
      expect(results[1].matchScore).toBe(50);
      expect(results.map((r) => r.offer.id)).toEqual([1, 3]);

      cosSpy.mockRestore();
    });

    it('devuelve array vacío si todas las ofertas están bajo el umbral', async () => {
      const offers = [{ id: 1, title: 'A' }];
      const cosSpy = jest
        .spyOn(recommendationService, 'cosineSimilarity')
        .mockReturnValue(0.1); // 10 < 40

      const results = await recommendationService.calculateSimilarityScores('text', offers);
      expect(results).toEqual([]);

      cosSpy.mockRestore();
    });
  });

  describe('calculateCompatibilityScore', () => {
    it('retorna 0 cuando el estudiante no tiene CV (error capturado)', async () => {
      models.Resume.findOne.mockResolvedValue(null);

      const score = await recommendationService.calculateCompatibilityScore(10, {
        id: 1,
        title: 'X',
      });

      expect(score).toBe(0);
    });
  });

  describe('buildOfferTextProfile', () => {
    it('construye texto a partir de campos de la oferta incluyendo careerTags', async () => {
      const offer = {
        title: 'Practicante Data',
        description: 'Análisis de datos',
        requirements: 'Python, SQL',
        area: 'Data',
        careerTags: ['Ingeniería', 'Estadística'],
      };

      const text = await recommendationService.buildOfferTextProfile(offer);
      expect(typeof text).toBe('string');
    });

    it('maneja ofertas sin careerTags', async () => {
      const offer = { title: 'Dev', description: 'd', requirements: 'r', area: 'a' };
      const text = await recommendationService.buildOfferTextProfile(offer);
      expect(typeof text).toBe('string');
    });
  });

  describe('getRecommendedOffers (orquestación)', () => {
    it('devuelve array vacío cuando no hay ofertas activas', async () => {
      models.Resume.findOne.mockResolvedValue({
        student: { career: 'Ing' },
        profile: { summary: 's' },
        skills: { areas: [], soft: '' },
      });
      models.Offer.findAll.mockResolvedValue([]);

      const result = await recommendationService.getRecommendedOffers(10);
      expect(result).toEqual([]);
    });

    it('orquesta buildStudentTextProfile + calculateSimilarityScores', async () => {
      models.Resume.findOne.mockResolvedValue({
        student: { career: 'Ing' },
        profile: { summary: 's' },
        skills: { areas: [], soft: '' },
      });
      const offers = [{ id: 1, title: 'A' }];
      models.Offer.findAll.mockResolvedValue(offers);

      const calcSpy = jest
        .spyOn(recommendationService, 'calculateSimilarityScores')
        .mockResolvedValue([{ offer: offers[0], matchScore: 90 }]);

      const result = await recommendationService.getRecommendedOffers(10);
      expect(result).toHaveLength(1);
      expect(result[0].matchScore).toBe(90);
      expect(calcSpy).toHaveBeenCalled();

      calcSpy.mockRestore();
    });
  });

  it('expone el umbral de compatibilidad COMPATIBILITY_THRESHOLD = 40', () => {
    expect(recommendationService.COMPATIBILITY_THRESHOLD).toBe(40);
  });
});
